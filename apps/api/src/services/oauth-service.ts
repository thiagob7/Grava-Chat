import { randomBytes, timingSafeEqual } from "node:crypto";

import { has, type Permission } from "@gravae/shared";
import { AppError, ForbiddenError, NotFoundError, UnauthorizedError } from "~/lib/http.js";
import { keys, redis } from "~/lib/redis.js";
import { toPublicUser } from "~/lib/serialize.js";
import { botRepository } from "~/repositories/bot-repository.js";
import { guildRepository, memberRepository } from "~/repositories/guild-repository.js";
import { userRepository } from "~/repositories/user-repository.js";
import { accessService } from "~/services/access-service.js";

const CODIGO_TTL = 120;
const TOKEN_TTL = 7 * 24 * 60 * 60;

export const ESCOPOS = ["identify", "guilds"] as const;
export type Escopo = (typeof ESCOPOS)[number];

interface Codigo {
  userId: string;
  botId: string;
  escopos: Escopo[];
  redirectUri: string;
}

interface TokenGuardado {
  userId: string;
  botId: string;
  escopos: Escopo[];
  criadoEm?: number;
}

function iguais(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);

  return x.length === y.length && timingSafeEqual(x, y);
}

export const oauthService = {
  async descreverPedido(params: { botId: string; redirectUri: string; escopos: string[] }) {
    const bot = await botRepository.findById(params.botId);
    if (!bot) throw new NotFoundError("Aplicação não encontrada");

    if (!bot.redirectUris.includes(params.redirectUri)) {
      throw new AppError("Esse endereço de retorno não está registrado nesta aplicação.", 400);
    }

    const pedidos = params.escopos.filter((e): e is Escopo =>
      (ESCOPOS as readonly string[]).includes(e),
    );

    if (!pedidos.length) throw new AppError("Nenhum escopo válido pedido.", 400);

    return {
      bot: {
        id: bot.id,
        usuario: toPublicUser(bot.usuario),
        descricao: bot.descricao,
      },
      escopos: pedidos,
      redirectUri: params.redirectUri,
    };
  },

  async emitirCodigo(userId: string, params: { botId: string; redirectUri: string; escopos: string[] }) {
    const pedido = await oauthService.descreverPedido(params);
    const codigo = randomBytes(32).toString("base64url");

    const dados: Codigo = {
      userId,
      botId: pedido.bot.id,
      escopos: pedido.escopos,
      redirectUri: params.redirectUri,
    };

    await redis.set(keys.oauthCode(codigo), JSON.stringify(dados), "EX", CODIGO_TTL);

    return { codigo, redirectUri: params.redirectUri };
  },

  async trocarCodigo(params: {
    codigo: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  }) {
    const bot = await botRepository.findById(params.clientId);
    if (!bot || !iguais(bot.clientSecret, params.clientSecret)) {
      throw new UnauthorizedError("Aplicação ou segredo inválido");
    }

    const bruto = await redis.getdel(keys.oauthCode(params.codigo));
    if (!bruto) throw new UnauthorizedError("Código expirado ou já usado");

    const codigo = JSON.parse(bruto) as Codigo;

    if (codigo.botId !== params.clientId || codigo.redirectUri !== params.redirectUri) {
      throw new UnauthorizedError("Código não confere com a aplicação");
    }

    const token = randomBytes(32).toString("base64url");
    const guardado: TokenGuardado = {
      userId: codigo.userId,
      botId: codigo.botId,
      escopos: codigo.escopos,
      criadoEm: Date.now(),
    };

    await redis
      .multi()
      .set(keys.oauthToken(token), JSON.stringify(guardado), "EX", TOKEN_TTL)
      .sadd(keys.oauthDaPessoa(codigo.userId), token)
      .expire(keys.oauthDaPessoa(codigo.userId), TOKEN_TTL)
      .exec();

    return { access_token: token, token_type: "Bearer", expires_in: TOKEN_TTL, scope: codigo.escopos.join(" ") };
  },

  async listarAutorizadas(userId: string) {
    const chave = keys.oauthDaPessoa(userId);
    const tokens = await redis.smembers(chave);
    if (!tokens.length) return [];

    const brutos = await redis.mget(tokens.map((t) => keys.oauthToken(t)));

    const mortos: string[] = [];
    const vivos: TokenGuardado[] = [];

    tokens.forEach((token, i) => {
      const bruto = brutos[i];
      if (!bruto) return mortos.push(token);

      const dados = JSON.parse(bruto) as TokenGuardado;

      if (dados.userId !== userId) return mortos.push(token);

      vivos.push(dados);
    });

    if (mortos.length) await redis.srem(chave, ...mortos);
    if (!vivos.length) return [];

    const porBot = new Map<string, { escopos: Set<Escopo>; criadoEm: number | null }>();

    for (const dados of vivos) {
      const atual = porBot.get(dados.botId) ?? { escopos: new Set<Escopo>(), criadoEm: null };

      dados.escopos.forEach((e) => atual.escopos.add(e));

      if (dados.criadoEm && (!atual.criadoEm || dados.criadoEm > atual.criadoEm)) {
        atual.criadoEm = dados.criadoEm;
      }

      porBot.set(dados.botId, atual);
    }

    const lista = await Promise.all(
      [...porBot].map(async ([botId, { escopos, criadoEm }]) => {
        const bot = await botRepository.findById(botId);

        if (!bot) return null;

        return {
          id: bot.id,
          usuario: toPublicUser(bot.usuario),
          descricao: bot.descricao,
          escopos: [...escopos],
          autorizadoEm: criadoEm ? new Date(criadoEm).toISOString() : null,
          expiraEm: criadoEm ? new Date(criadoEm + TOKEN_TTL * 1000).toISOString() : null,
        };
      }),
    );

    return lista
      .filter((a) => a !== null)
      .sort((a, b) => (b.autorizadoEm ?? "").localeCompare(a.autorizadoEm ?? ""));
  },

  async revogarAplicacao(userId: string, botId: string) {
    const chave = keys.oauthDaPessoa(userId);
    const tokens = await redis.smembers(chave);
    if (!tokens.length) throw new NotFoundError("Essa aplicação não tem acesso à sua conta");

    const brutos = await redis.mget(tokens.map((t) => keys.oauthToken(t)));

    const alvos = tokens.filter((_, i) => {
      const bruto = brutos[i];
      if (!bruto) return false;

      const dados = JSON.parse(bruto) as TokenGuardado;

      return dados.botId === botId && dados.userId === userId;
    });

    if (!alvos.length) throw new NotFoundError("Essa aplicação não tem acesso à sua conta");

    await redis
      .multi()
      .del(...alvos.map((t) => keys.oauthToken(t)))
      .srem(chave, ...alvos)
      .exec();

    return { revogados: alvos.length };
  },

  async resolverToken(token: string): Promise<TokenGuardado> {
    const bruto = await redis.get(keys.oauthToken(token));
    if (!bruto) throw new UnauthorizedError("Token inválido ou expirado");

    return JSON.parse(bruto) as TokenGuardado;
  },

  exigirEscopo(sessao: TokenGuardado, escopo: Escopo) {
    if (!sessao.escopos.includes(escopo)) {
      throw new ForbiddenError(`Esta aplicação não pediu o escopo "${escopo}"`);
    }
  },

  async quemEh(sessao: TokenGuardado) {
    oauthService.exigirEscopo(sessao, "identify");

    const user = await userRepository.findById(sessao.userId);
    if (!user) throw new NotFoundError("Usuário não encontrado");

    return toPublicUser(user);
  },

  async servidoresDe(sessao: TokenGuardado) {
    oauthService.exigirEscopo(sessao, "guilds");

    const [membros, bot] = await Promise.all([
      memberRepository.guildIdsOf(sessao.userId),
      botRepository.findById(sessao.botId),
    ]);

    const lista = await Promise.all(
      membros.map(async (m) => {
        const guild = await guildRepository.findById(m.guildId);
        if (!guild) return null;

        const contexto = await accessService
          .contextOf(sessao.userId, m.guildId)
          .catch(() => null);

        const permissoes = contexto?.permissions ?? new Set<Permission>();

        const temOBot = bot
          ? Boolean(await memberRepository.find(m.guildId, bot.botUserId))
          : false;

        return {
          id: guild.id,
          name: guild.name,
          iconUrl: guild.iconUrl,
          owner: guild.ownerId === sessao.userId,
          gerencia: has(permissoes, "MANAGE_GUILD"),
          temOBot,
        };
      }),
    );

    return lista.filter((g) => g !== null);
  },
};
