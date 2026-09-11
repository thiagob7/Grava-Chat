import { randomBytes, timingSafeEqual } from "node:crypto";

import { SCOPES, has, type ScopeAuth, type Permission } from "@gravae/shared";
import { AppError, ForbiddenError, NotFoundError, UnauthorizedError } from "~/lib/http.js";
import { keys, redis } from "~/lib/redis.js";
import { toPublicUser } from "~/lib/serialize.js";
import { botRepository } from "~/repositories/bot-repository.js";
import { guildRepository, memberRepository } from "~/repositories/guild-repository.js";
import { userRepository } from "~/repositories/user-repository.js";
import { accessService } from "~/services/access-service.js";
import { botService } from "~/services/bot-service.js";

const CODE_TTL = 120;
const TOKEN_TTL = 7 * 24 * 60 * 60;

type Scope = ScopeAuth;

interface Code {
  userId: string;
  botId: string;
  scopes: Scope[];
  redirectUri: string;
}

interface TokenStored {
  userId: string;
  botId: string;
  scopes: Scope[];
  createdAt?: number;
}

function equal(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);

  return x.length === y.length && timingSafeEqual(x, y);
}

export const oauthService = {
  async describeRequest(params: { botId: string; redirectUri: string; scopes: string[] }) {
    const bot = await botRepository.findById(params.botId);
    if (!bot) throw new NotFoundError("Aplicação não encontrada");

    if (!bot.redirectUris.includes(params.redirectUri)) {
      throw new AppError("Esse endereço de retorno não está registrado nesta aplicação.", 400);
    }

    const requests = params.scopes.filter((e): e is Scope =>
      (SCOPES as readonly string[]).includes(e),
    );

    if (!requests.length) throw new AppError("Nenhum escopo válido pedido.", 400);

    return {
      bot: {
        id: bot.id,
        user: toPublicUser(bot.user),
        description: bot.description,
        permissionsRequested: bot.permissionsRequested as Permission[],
      },
      scopes: requests,
      redirectUri: params.redirectUri,
    };
  },

  async emitCode(
    userId: string,
    params: { botId: string; redirectUri: string; scopes: string[]; guildId?: string; permissions?: string[] },
  ) {
    const request = await oauthService.describeRequest(params);

    if (request.scopes.includes("bot")) {
      if (!params.guildId) throw new AppError("Escolha a comunidade onde o bot vai entrar.", 400);

      const alreadyThis = await botService.thisAt(request.bot.id, params.guildId);
      if (!alreadyThis) await botService.addServer(userId, request.bot.id, params.guildId, params.permissions);
    }

    const code = randomBytes(32).toString("base64url");

    const data: Code = {
      userId,
      botId: request.bot.id,
      scopes: request.scopes,
      redirectUri: params.redirectUri,
    };

    await redis.set(keys.oauthCode(code), JSON.stringify(data), "EX", CODE_TTL);

    return { code, redirectUri: params.redirectUri };
  },

  async swapCode(params: {
    code: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  }) {
    const bot = await botRepository.findById(params.clientId);
    if (!bot || !equal(bot.clientSecret, params.clientSecret)) {
      throw new UnauthorizedError("Aplicação ou segredo inválido");
    }

    const raw = await redis.getdel(keys.oauthCode(params.code));
    if (!raw) throw new UnauthorizedError("Código expirado ou já usado");

    const code = JSON.parse(raw) as Code;

    if (code.botId !== params.clientId || code.redirectUri !== params.redirectUri) {
      throw new UnauthorizedError("Código não confere com a aplicação");
    }

    const token = randomBytes(32).toString("base64url");
    const kept: TokenStored = {
      userId: code.userId,
      botId: code.botId,
      scopes: code.scopes,
      createdAt: Date.now(),
    };

    await redis
      .multi()
      .set(keys.oauthToken(token), JSON.stringify(kept), "EX", TOKEN_TTL)
      .sadd(keys.personOauth(code.userId), token)
      .expire(keys.personOauth(code.userId), TOKEN_TTL)
      .exec();

    return { access_token: token, token_type: "Bearer", expires_in: TOKEN_TTL, scope: code.scopes.join(" ") };
  },

  async listAuthorized(userId: string) {
    const key = keys.personOauth(userId);
    const tokens = await redis.smembers(key);
    if (!tokens.length) return [];

    const rawList = await redis.mget(tokens.map((t) => keys.oauthToken(t)));

    const dead: string[] = [];
    const live: TokenStored[] = [];

    tokens.forEach((token, i) => {
      const raw = rawList[i];
      if (!raw) return dead.push(token);

      const data = JSON.parse(raw) as TokenStored;

      if (data.userId !== userId) return dead.push(token);

      live.push(data);
    });

    if (dead.length) await redis.srem(key, ...dead);
    if (!live.length) return [];

    const byBot = new Map<string, { scopes: Set<Scope>; createdAt: number | null }>();

    for (const data of live) {
      const current = byBot.get(data.botId) ?? { scopes: new Set<Scope>(), createdAt: null };

      data.scopes.forEach((e) => current.scopes.add(e));

      if (data.createdAt && (!current.createdAt || data.createdAt > current.createdAt)) {
        current.createdAt = data.createdAt;
      }

      byBot.set(data.botId, current);
    }

    const list = await Promise.all(
      [...byBot].map(async ([botId, { scopes, createdAt }]) => {
        const bot = await botRepository.findById(botId);

        if (!bot) return null;

        return {
          id: bot.id,
          user: toPublicUser(bot.user),
          description: bot.description,
          scopes: [...scopes],
          authorizedAt: createdAt ? new Date(createdAt).toISOString() : null,
          expiresAt: createdAt ? new Date(createdAt + TOKEN_TTL * 1000).toISOString() : null,
        };
      }),
    );

    return list
      .filter((a) => a !== null)
      .sort((a, b) => (b.authorizedAt ?? "").localeCompare(a.authorizedAt ?? ""));
  },

  async revokeApplication(userId: string, botId: string) {
    const key = keys.personOauth(userId);
    const tokens = await redis.smembers(key);
    if (!tokens.length) throw new NotFoundError("Essa aplicação não tem acesso à sua conta");

    const rawList = await redis.mget(tokens.map((t) => keys.oauthToken(t)));

    const targets = tokens.filter((_, i) => {
      const raw = rawList[i];
      if (!raw) return false;

      const data = JSON.parse(raw) as TokenStored;

      return data.botId === botId && data.userId === userId;
    });

    if (!targets.length) throw new NotFoundError("Essa aplicação não tem acesso à sua conta");

    await redis
      .multi()
      .del(...targets.map((t) => keys.oauthToken(t)))
      .srem(key, ...targets)
      .exec();

    return { revoked: targets.length };
  },

  async resolveToken(token: string): Promise<TokenStored> {
    const raw = await redis.get(keys.oauthToken(token));
    if (!raw) throw new UnauthorizedError("Token inválido ou expirado");

    return JSON.parse(raw) as TokenStored;
  },

  requireScope(session: TokenStored, scope: Scope) {
    if (!session.scopes.includes(scope)) {
      throw new ForbiddenError(`Esta aplicação não pediu o escopo "${scope}"`);
    }
  },

  async whoIs(session: TokenStored) {
    oauthService.requireScope(session, "identify");

    const user = await userRepository.findById(session.userId);
    if (!user) throw new NotFoundError("Usuário não encontrado");

    const profile = user.profile as { connections?: unknown[] } | null;

    return {
      ...toPublicUser(user),
      ...(session.scopes.includes("email") ? { email: user.email } : {}),
      ...(session.scopes.includes("connections") ? { connections: profile?.connections ?? [] } : {}),
    };
  },

  async servers(session: TokenStored) {
    oauthService.requireScope(session, "guilds");

    const [members, bot] = await Promise.all([
      memberRepository.guildIdsOf(session.userId),
      botRepository.findById(session.botId),
    ]);

    const list = await Promise.all(
      members.map(async (m) => {
        const guild = await guildRepository.findById(m.guildId);
        if (!guild) return null;

        const context = await accessService
          .contextOf(session.userId, m.guildId)
          .catch(() => null);

        const permissions = context?.permissions ?? new Set<Permission>();

        const hasBot = bot
          ? Boolean(await memberRepository.find(m.guildId, bot.botUserId))
          : false;

        return {
          id: guild.id,
          name: guild.name,
          iconUrl: guild.iconUrl,
          owner: guild.ownerId === session.userId,
          manages: has(permissions, "MANAGE_GUILD"),
          hasBot,
        };
      }),
    );

    return list.filter((g) => g !== null);
  },
};
