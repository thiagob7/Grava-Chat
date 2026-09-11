import { createHash, randomBytes } from "node:crypto";
import { AppError, NotFoundError, UnauthorizedError } from "~/lib/http.js";
import { officialService } from "~/services/oficial-service.js";
import { checkPassword, generateHash } from "~/lib/senha.js";
import { userRepository } from "~/repositories/user-repository.js";
import { sessionRepository } from "~/repositories/session-repository.js";
import { accountRepository } from "~/repositories/account-repository.js";

export const REFRESH_COOKIE = "gravae_rt";
export const ACCESS_TTL = "15m";
export const REFRESH_TTL_DAYS = 30;

const ROTATION_GRACE_MS = 30_000;

const hashToken = (raw: string) => createHash("sha256").update(raw).digest("hex");

export type SessionMeta = { userAgent?: string; ip?: string };

export type RotationResult = { userId: string; raw: string; expiresAt: Date };

export const authService = {
  async issueRefreshToken(userId: string, meta: SessionMeta) {
    const raw = randomBytes(48).toString("base64url");
    const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

    await sessionRepository.create({ userId, tokenHash: hashToken(raw), expiresAt, ...meta });
    return { raw, expiresAt };
  },

  async rotateRefreshToken(raw: string, meta: SessionMeta): Promise<RotationResult | null> {
    const existing = await sessionRepository.findByHash(hashToken(raw));
    if (!existing || existing.expiresAt < new Date()) return null;

    if (existing.revokedAt) return null;

    if (existing.supersededAt) {
      const age = Date.now() - existing.supersededAt.getTime();
      if (age > ROTATION_GRACE_MS) return null;

      return { userId: existing.userId, ...(await authService.issueRefreshToken(existing.userId, meta)) };
    }

    await sessionRepository.claimForRotation(existing.id);

    return { userId: existing.userId, ...(await authService.issueRefreshToken(existing.userId, meta)) };
  },

  async revoke(raw: string) {
    await sessionRepository.revoke(hashToken(raw));
  },

  async listSessions(userId: string, raw: string | undefined) {
    const current = raw ? hashToken(raw) : null;
    const sessions = await sessionRepository.findActiveForUser(userId);

    const currentFrom = current
      ? await sessionRepository.findByHash(current).then((s) => s?.id ?? null)
      : null;

    return sessions.map((s) => ({
      id: s.id,
      userAgent: s.userAgent,
      ip: s.ip,
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
      current: s.id === currentFrom,
    }));
  },

  async revokeSession(userId: string, id: string, raw: string | undefined) {
    const current = raw ? await sessionRepository.findByHash(hashToken(raw)) : null;

    if (current?.id === id) {
      throw new AppError("Esta é a sessão deste aparelho. Use 'Sair desta conta'.");
    }

    const gave = await sessionRepository.revokeById(userId, id);
    if (!gave) throw new NotFoundError("Sessão não encontrada");
  },

  async revokeAll(userId: string) {
    await sessionRepository.revokeAllForUser(userId);
  },

  async requireUser(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new UnauthorizedError("Usuário não existe mais");
    return user;
  },

  async providersOf(userId: string) {
    const accounts = await accountRepository.findManyByUser(userId);
    return accounts.map((c) => c.provider);
  },

  async uniqueUsername(seed: string) {
    const base =
      seed
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, "")
        .slice(0, 24) || "user";

    for (let i = 0; i < 50; i++) {
      const candidate = i === 0 ? base : `${base}${i + 1}`;
      if (!(await userRepository.findByUsername(candidate))) return candidate;
    }

    return `${base}${randomBytes(3).toString("hex")}`;
  },

  async findOrCreateUser(params: { email: string; displayName?: string; avatarUrl?: string | null }) {
    const existing = await userRepository.findByEmail(params.email);
    if (existing) return existing;

    const seed = params.email.split("@")[0] ?? "user";

    return userRepository.create({
      email: params.email,
      username: await authService.uniqueUsername(seed),
      displayName: params.displayName ?? seed,
      avatarUrl: params.avatarUrl ?? null,
    });
  },

  async register(params: { email: string; password: string; displayName: string }) {
    const email = params.email.toLowerCase();

    if (await userRepository.findByEmail(email)) {
      throw new AppError("Já existe uma conta com esse e-mail. Entre com ela.", 409);
    }

    const user = await userRepository.create({
      email,
      username: await authService.uniqueUsername(email.split("@")[0] ?? "user"),
      displayName: params.displayName,
      passwordHash: await generateHash(params.password),
    });

    await accountRepository.create({ userId: user.id, provider: "senha", providerAccountId: email });

    return user;
  },

  async joinWithPassword(params: { email: string; password: string }) {
    const user = await userRepository.findByEmail(params.email.toLowerCase());
    const kept = user?.passwordHash;

    if (!user || !kept || !(await checkPassword(params.password, kept))) {
      throw new UnauthorizedError("E-mail ou senha errados");
    }

    return user;
  },

  async swapPassword(userId: string, params: { current?: string; fresh: string }) {
    const user = await authService.requireUser(userId);

    if (user.passwordHash) {
      if (!params.current || !(await checkPassword(params.current, user.passwordHash))) {
        throw new AppError("A senha atual não confere");
      }
    }

    await userRepository.update(userId, { passwordHash: await generateHash(params.fresh) });

    const accounts = await accountRepository.findManyByUser(userId);
    if (!accounts.some((c) => c.provider === "senha")) {
      await accountRepository.create({ userId, provider: "senha", providerAccountId: user.email });
    }

    void officialService.notify(userId, "passwordSwapped", undefined);
  },

  async signInWithProvider(params: {
    provider: string;
    providerAccountId: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
  }) {
    const linked = await accountRepository.findByProvider(params.provider, params.providerAccountId);
    if (linked) return linked.user;

    const user = await authService.findOrCreateUser({
      email: params.email,
      displayName: params.displayName,
      avatarUrl: params.avatarUrl,
    });

    await accountRepository.create({
      userId: user.id,
      provider: params.provider,
      providerAccountId: params.providerAccountId,
    });

    if (!user.avatarUrl && params.avatarUrl) {
      return userRepository.update(user.id, { avatarUrl: params.avatarUrl });
    }

    return user;
  },
};
