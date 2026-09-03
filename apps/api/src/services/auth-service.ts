import { createHash, randomBytes } from "node:crypto";
import { AppError, NotFoundError, UnauthorizedError } from "~/lib/http.js";
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
      const idade = Date.now() - existing.supersededAt.getTime();
      if (idade > ROTATION_GRACE_MS) return null;

      return { userId: existing.userId, ...(await authService.issueRefreshToken(existing.userId, meta)) };
    }

    await sessionRepository.claimForRotation(existing.id);

    return { userId: existing.userId, ...(await authService.issueRefreshToken(existing.userId, meta)) };
  },

  async revoke(raw: string) {
    await sessionRepository.revoke(hashToken(raw));
  },

  /*
    As sessões vivas, com a atual marcada.

    Saber qual é a atual não é enfeite: sem isso a pessoa desconecta a si mesma
    achando que está fechando o computador do trabalho, e leva um logout que
    parece bug. O `raw` vem do cookie de quem está pedindo — é a única forma de
    o servidor reconhecer o próprio aparelho de quem chama.
  */
  async listarSessoes(userId: string, raw: string | undefined) {
    const atual = raw ? hashToken(raw) : null;
    const sessoes = await sessionRepository.findAtivasForUser(userId);

    /*
      A comparação é por HASH, e o hash não sai daqui.

      Devolver o hash da sessão pro cliente entregaria o material de um ataque
      de repetição a quem conseguisse ler a resposta. O que sai é um booleano.
    */
    const daAtual = atual
      ? await sessionRepository.findByHash(atual).then((s) => s?.id ?? null)
      : null;

    return sessoes.map((s) => ({
      id: s.id,
      userAgent: s.userAgent,
      ip: s.ip,
      criadaEm: s.createdAt.toISOString(),
      expiraEm: s.expiresAt.toISOString(),
      atual: s.id === daAtual,
    }));
  },

  /// Derruba UMA sessão. A atual não passa: sair daqui é o botão de sair, que
  /// limpa o cookie junto — por esta rota o app ficaria com um cookie morto na
  /// mão, sem saber que perdeu a sessão.
  async revogarSessao(userId: string, id: string, raw: string | undefined) {
    const atual = raw ? await sessionRepository.findByHash(hashToken(raw)) : null;

    if (atual?.id === id) {
      throw new AppError("Esta é a sessão deste aparelho. Use 'Sair desta conta'.");
    }

    const deu = await sessionRepository.revokeById(userId, id);
    if (!deu) throw new NotFoundError("Sessão não encontrada");
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
    const contas = await accountRepository.findManyByUser(userId);
    return contas.map((c) => c.provider);
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
