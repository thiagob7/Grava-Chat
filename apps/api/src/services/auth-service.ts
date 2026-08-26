import { createHash, randomBytes } from "node:crypto";
import { UnauthorizedError } from "~/lib/http.js";
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
