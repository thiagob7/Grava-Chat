import { createHash, randomBytes } from "node:crypto";

import {
  ADMIN_AREAS,
  ADMIN_PASSWORD_MIN,
  isAdminArea,
  type AdminArea,
  type AdminLogEntry,
  type AdminMe,
  type AdminMemberView,
  type AdminOwnerView,
} from "@gravae/shared";

import { AppError, ForbiddenError, NotFoundError } from "~/lib/http.js";
import { prisma } from "~/lib/prisma.js";
import { keys, redis } from "~/lib/redis.js";
import { checkPassword, generateHash } from "~/lib/senha.js";
import { ADMINS, isAdmin } from "~/lib/serialize.js";
import { userRepository } from "~/repositories/user-repository.js";

const locked = () => new AppError("Digite a senha do painel para continuar.", 423);
const wrongPassword = (message: string) => new AppError(message, 403);

const SESSION_S_TTL = 12 * 60 * 60;
const ATTEMPTS_LIMIT = 5;
const ATTEMPTS_S_WINDOW = 15 * 60;

interface Session {
  userId: string;
  createdAt: number;
}

export interface AdminAccess {
  role: "dono" | "admin";
  userId: string;
  email: string;
  areas: AdminArea[];
  memberId: string | null;
  mustChangePassword: boolean;
  passwordSetAt: number;
}

const fingerprint = (token: string) => createHash("sha256").update(token).digest("hex");

const cleanAreas = (areas: unknown[]): AdminArea[] => [...new Set(areas.filter(isAdminArea))];

async function accessOf(userId: string): Promise<AdminAccess | null> {
  const user = await userRepository.findById(userId);
  if (!user) return null;

  if (isAdmin(user.email)) {
    return {
      role: "dono",
      userId,
      email: user.email,
      areas: [...ADMIN_AREAS],
      memberId: null,
      mustChangePassword: false,
      passwordSetAt: 0,
    };
  }

  const member = await prisma.adminMember.findFirst({ where: { userId } });
  if (!member) return null;

  return {
    role: "admin",
    userId,
    email: user.email,
    areas: cleanAreas(member.areas),
    memberId: member.id,
    mustChangePassword: member.mustChangePassword,
    passwordSetAt: member.passwordSetAt.getTime(),
  };
}

async function sessionOf(token: string | undefined): Promise<Session | null> {
  if (!token) return null;

  const raw = await redis.get(keys.adminSession(fingerprint(token)));
  return raw ? (JSON.parse(raw) as Session) : null;
}

async function sessionValid(access: AdminAccess, token: string | undefined) {
  if (access.role === "dono") return true;

  const session = await sessionOf(token);
  return Boolean(session && session.userId === access.userId && session.createdAt >= access.passwordSetAt);
}

async function log(actorId: string, action: string, detail?: Record<string, unknown>) {
  await prisma.adminLog
    .create({ data: { actorId, action, detail: (detail ?? undefined) as never } })
    .catch(() => undefined);
}

function requirePasswordShape(password: string) {
  if (password.length < ADMIN_PASSWORD_MIN) {
    throw new AppError(`A senha do painel precisa de pelo menos ${ADMIN_PASSWORD_MIN} caracteres.`);
  }
}

export const adminService = {
  accessOf,
  log,

  async hasAccess(userId: string): Promise<boolean> {
    return (await accessOf(userId)) !== null;
  },

  async me(userId: string, token: string | undefined): Promise<AdminMe | null> {
    const access = await accessOf(userId);
    if (!access) return null;

    const open = await sessionValid(access, token);

    return {
      role: access.role,
      email: access.email,
      areas: access.areas,
      locked: !open,
      mustChangePassword: open && access.mustChangePassword,
    };
  },

  async require(userId: string, token: string | undefined, area: AdminArea): Promise<AdminAccess> {
    const access = await accessOf(userId);
    if (!access) throw new NotFoundError("Não encontrado");

    if (!(await sessionValid(access, token))) {
      throw locked();
    }

    if (access.mustChangePassword) {
      throw new ForbiddenError("Troque a senha provisória antes de usar o painel.");
    }

    if (!access.areas.includes(area)) {
      throw new ForbiddenError("Sua conta não tem acesso a esta parte do painel.");
    }

    return access;
  },

  async unlock(userId: string, password: string): Promise<{ token: string; mustChangePassword: boolean }> {
    const access = await accessOf(userId);
    if (!access || access.role === "dono" || !access.memberId) throw new NotFoundError("Não encontrado");

    const attempts = await redis.incr(keys.adminAttempts(userId));
    if (attempts === 1) await redis.expire(keys.adminAttempts(userId), ATTEMPTS_S_WINDOW);
    if (attempts > ATTEMPTS_LIMIT) {
      throw new AppError("Muitas tentativas. Espere quinze minutos e tente de novo.", 429);
    }

    const member = await prisma.adminMember.findUnique({ where: { id: access.memberId } });
    if (!member || !(await checkPassword(password, member.passwordHash))) {
      throw wrongPassword("Senha do painel incorreta.");
    }

    await redis.del(keys.adminAttempts(userId));

    const token = randomBytes(32).toString("base64url");
    const session: Session = { userId, createdAt: Date.now() };
    await redis.set(keys.adminSession(fingerprint(token)), JSON.stringify(session), "EX", SESSION_S_TTL);

    await prisma.adminMember.update({ where: { id: member.id }, data: { lastUnlockAt: new Date() } });
    await log(userId, "entrou");

    return { token, mustChangePassword: member.mustChangePassword };
  },

  async lock(token: string | undefined) {
    if (token) await redis.del(keys.adminSession(fingerprint(token)));
  },

  async changePassword(
    userId: string,
    token: string | undefined,
    current: string,
    fresh: string,
  ): Promise<{ token: string }> {
    const access = await accessOf(userId);
    if (!access || !access.memberId) throw new NotFoundError("Não encontrado");
    if (!(await sessionValid(access, token))) throw locked();

    requirePasswordShape(fresh);

    const member = await prisma.adminMember.findUnique({ where: { id: access.memberId } });
    if (!member || !(await checkPassword(current, member.passwordHash))) {
      throw wrongPassword("A senha atual não confere.");
    }

    if (await checkPassword(fresh, member.passwordHash)) {
      throw new AppError("A senha nova precisa ser diferente da atual.");
    }

    const setAt = new Date();
    await prisma.adminMember.update({
      where: { id: member.id },
      data: { passwordHash: await generateHash(fresh), mustChangePassword: false, passwordSetAt: setAt },
    });

    await this.lock(token);

    const renewed = randomBytes(32).toString("base64url");
    const session: Session = { userId, createdAt: setAt.getTime() };
    await redis.set(keys.adminSession(fingerprint(renewed)), JSON.stringify(session), "EX", SESSION_S_TTL);

    await log(userId, "trocou-a-senha");

    return { token: renewed };
  },

  async list(): Promise<{ owners: AdminOwnerView[]; members: AdminMemberView[] }> {
    const members = await prisma.adminMember.findMany({ orderBy: { createdAt: "asc" } });
    const people = await userRepository.findManyByIds([
      ...members.map((m) => m.userId),
      ...members.map((m) => m.addedById).filter((id): id is string => Boolean(id)),
    ]);
    const byId = new Map(people.map((p) => [p.id, p]));

    const owners = await Promise.all(
      [...ADMINS].map(async (email) => {
        const user = await userRepository.findByEmail(email).catch(() => null);
        return { email, displayName: user?.displayName ?? null, avatarUrl: user?.avatarUrl ?? null };
      }),
    );

    return {
      owners,
      members: members.map((m) => {
        const user = byId.get(m.userId);
        return {
          id: m.id,
          userId: m.userId,
          email: m.email,
          displayName: user?.displayName ?? m.email,
          avatarUrl: user?.avatarUrl ?? null,
          areas: cleanAreas(m.areas),
          mustChangePassword: m.mustChangePassword,
          addedBy: m.addedById ? (byId.get(m.addedById)?.displayName ?? null) : null,
          createdAt: m.createdAt.toISOString(),
          lastUnlockAt: m.lastUnlockAt?.toISOString() ?? null,
        };
      }),
    };
  },

  grantable(actor: AdminAccess, areas: AdminArea[]): AdminArea[] {
    const wanted = cleanAreas(areas);

    for (const area of wanted) {
      if (area === "administradores" && actor.role !== "dono") {
        throw new ForbiddenError("Só o dono libera a gestão de administradores.");
      }
      if (!actor.areas.includes(area)) {
        throw new ForbiddenError("Você não pode liberar uma área que não tem.");
      }
    }

    return wanted;
  },

  async add(actor: AdminAccess, input: { email: string; areas: AdminArea[]; password: string }) {
    const email = input.email.trim().toLowerCase();
    requirePasswordShape(input.password);

    if (isAdmin(email)) throw new AppError("Este e-mail já é dono do painel.");

    const user = await userRepository.findByEmail(email);
    if (!user) throw new NotFoundError("Não há conta no Gravaê com este e-mail. A pessoa precisa criar a conta antes.");
    if (user.isBot || user.system) throw new AppError("Bot e conta do sistema não entram no painel.");

    const existing = await prisma.adminMember.findFirst({ where: { userId: user.id } });
    if (existing) throw new AppError("Esta pessoa já está no painel.");

    const areas = this.grantable(actor, input.areas);
    if (!areas.length) throw new AppError("Marque pelo menos uma área.");

    const member = await prisma.adminMember.create({
      data: {
        userId: user.id,
        email,
        areas,
        passwordHash: await generateHash(input.password),
        mustChangePassword: true,
        addedById: actor.userId,
      },
    });

    await log(actor.userId, "adicionou", { email, areas });
    return member.id;
  },

  async memberToManage(actor: AdminAccess, memberId: string) {
    const member = await prisma.adminMember.findUnique({ where: { id: memberId } });
    if (!member) throw new NotFoundError("Administrador não encontrado");
    if (member.userId === actor.userId) throw new ForbiddenError("Você não mexe no próprio acesso por aqui.");

    return member;
  },

  async setAreas(actor: AdminAccess, memberId: string, areas: AdminArea[]) {
    const member = await this.memberToManage(actor, memberId);
    const next = this.grantable(actor, areas);
    if (!next.length) throw new AppError("Marque pelo menos uma área, ou remova a pessoa.");

    const removed = cleanAreas(member.areas).filter((area) => !next.includes(area));
    this.grantable(actor, removed);

    await prisma.adminMember.update({ where: { id: member.id }, data: { areas: next } });
    await log(actor.userId, "mudou-as-areas", { email: member.email, areas: next });
  },

  async resetPassword(actor: AdminAccess, memberId: string, password: string) {
    const member = await this.memberToManage(actor, memberId);
    requirePasswordShape(password);

    await prisma.adminMember.update({
      where: { id: member.id },
      data: { passwordHash: await generateHash(password), mustChangePassword: true, passwordSetAt: new Date() },
    });
    await redis.del(keys.adminAttempts(member.userId));
    await log(actor.userId, "redefiniu-a-senha", { email: member.email });
  },

  async remove(actor: AdminAccess, memberId: string) {
    const member = await this.memberToManage(actor, memberId);
    this.grantable(actor, cleanAreas(member.areas));

    await prisma.adminMember.delete({ where: { id: member.id } });
    await log(actor.userId, "removeu", { email: member.email });
  },

  async history(limit = 40): Promise<AdminLogEntry[]> {
    const entries = await prisma.adminLog.findMany({ orderBy: { createdAt: "desc" }, take: limit });
    const people = await userRepository.findManyByIds([...new Set(entries.map((e) => e.actorId))]);
    const byId = new Map(people.map((p) => [p.id, p.displayName]));

    return entries.map((e) => ({
      id: e.id,
      actor: byId.get(e.actorId) ?? "alguém",
      action: e.action,
      detail: (e.detail as Record<string, unknown> | null) ?? null,
      createdAt: e.createdAt.toISOString(),
    }));
  },
};
