import { createHash, randomBytes } from "node:crypto";
import { UnauthorizedError } from "~/lib/http.js";
import { userRepository } from "~/repositories/user-repository.js";
import { sessionRepository } from "~/repositories/session-repository.js";
import { accountRepository } from "~/repositories/account-repository.js";

export const REFRESH_COOKIE = "gravae_rt";
export const ACCESS_TTL = "15m";
export const REFRESH_TTL_DAYS = 30;

/**
 * Janela em que um token recém-rotacionado ainda é aceito. Duas abas (ou o app
 * desktop e o navegador) que abrem ao mesmo tempo mandam o MESMO refresh token:
 * sem essa folga, a segunda chegaria com um token já rotacionado e o usuário
 * seria deslogado sem ter feito nada.
 */
const ROTATION_GRACE_MS = 30_000;

/** Guardamos o HASH, nunca o token. Se o banco vazar, os tokens não servem. */
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

  /**
   * Rotaciona: valida o antigo, marca como substituído e emite um novo.
   * Rotacionar em vez de reutilizar significa que um token roubado só vale até
   * o dono usar o dele.
   */
  async rotateRefreshToken(raw: string, meta: SessionMeta): Promise<RotationResult | null> {
    const existing = await sessionRepository.findByHash(hashToken(raw));
    if (!existing || existing.expiresAt < new Date()) return null;

    /**
     * Revogado de verdade (logout) nunca volta — nem dentro da janela de
     * tolerância. Sem essa separação, a tolerância anularia o "sair de todos os
     * dispositivos": bastaria pedir refresh nos 30s seguintes.
     */
    if (existing.revokedAt) return null;

    /**
     * Token já rotacionado, mas dentro da janela: emite um token NOVO e devolve
     * o cookie. Antes aqui só saía um access token e o navegador continuava com
     * o cookie antigo — o que funcionava enquanto a janela durasse e derrubava
     * a sessão depois, do nada.
     *
     * Isso acontece de verdade: um reload que aborta a resposta do refresh faz
     * o navegador perder o cookie novo e ficar preso no anterior. Reancorar a
     * cadeia aqui é o que faz a sessão se curar sozinha.
     */
    if (existing.supersededAt) {
      const idade = Date.now() - existing.supersededAt.getTime();
      if (idade > ROTATION_GRACE_MS) return null;

      return { userId: existing.userId, ...(await authService.issueRefreshToken(existing.userId, meta)) };
    }

    // Perder a corrida do CAS é a mesma situação: outra requisição rotacionou
    // agora mesmo, e esta também precisa sair com um cookie utilizável.
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

  /** Como esta conta entra: "google", ou vazio para quem veio pelo dev-login. */
  async providersOf(userId: string) {
    const contas = await accountRepository.findManyByUser(userId);
    return contas.map((c) => c.provider);
  },

  /** Gera um username único a partir do email/nome: `thiago`, `thiago2`… */
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

  /** Ponto único de entrada de qualquer provedor. */
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

  /**
   * Login por provedor externo. A conta é ligada pelo id do provedor, não pelo
   * email: se a pessoa trocar o email no Google, continua sendo a mesma conta.
   * O email só serve para reencontrar quem já entrou por outro caminho (o
   * dev-login, por exemplo) e então vincular.
   */
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

    // Só preenche o avatar se ainda não houver um — não sobrescreve escolha do usuário.
    if (!user.avatarUrl && params.avatarUrl) {
      return userRepository.update(user.id, { avatarUrl: params.avatarUrl });
    }

    return user;
  },
};
