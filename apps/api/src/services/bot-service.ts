import { randomBytes } from "node:crypto";

import {
  PERMISSIONS,
  comandoDeBotSchema,
  type ComandoDeBot,
  type Permission,
} from "@gravae/shared";
import { AppError, ForbiddenError, NotFoundError } from "~/lib/http.js";
import { toPublicUser } from "~/lib/serialize.js";
import { botRepository } from "~/repositories/bot-repository.js";
import { memberRepository, guildRepository } from "~/repositories/guild-repository.js";
import { roleRepository } from "~/repositories/role-repository.js";
import { userRepository } from "~/repositories/user-repository.js";
import { accessService } from "~/services/access-service.js";
import { authService } from "~/services/auth-service.js";

const LIMITE_POR_PESSOA = 10;

const PEDIDO_PADRAO: Permission[] = [
  "VIEW_CHANNEL",
  "SEND_MESSAGES",
  "READ_MESSAGE_HISTORY",
  "ADD_REACTIONS",
  "ATTACH_FILES",
];

const novoToken = () => randomBytes(32).toString("base64url");

type BotComUsuario = NonNullable<Awaited<ReturnType<typeof botRepository.findById>>>;

const paraDono = (bot: BotComUsuario, token?: string) => ({
  id: bot.id,
  usuario: toPublicUser(bot.usuario),
  descricao: bot.descricao,
  permissoesPedidas: bot.permissoesPedidas as Permission[],
  publico: bot.publico,
  redirectUris: bot.redirectUris,
  clientSecret: bot.clientSecret,
  createdAt: bot.createdAt.toISOString(),
  ...(token ? { token } : {}),
});

const paraConvite = (bot: BotComUsuario) => ({
  id: bot.id,
  usuario: toPublicUser(bot.usuario),
  descricao: bot.descricao,
  permissoesPedidas: bot.permissoesPedidas as Permission[],
  publico: bot.publico,
});

export const botService = {
  async listar(ownerId: string) {
    return (await botRepository.findManyOf(ownerId)).map((b) => paraDono(b));
  },

  async criar(ownerId: string, nome: string) {
    const meus = await botRepository.findManyOf(ownerId);
    if (meus.length >= LIMITE_POR_PESSOA) {
      throw new AppError(`Você já tem ${LIMITE_POR_PESSOA} bots.`, 400);
    }

    const usuario = await userRepository.create({
      email: `bot-${randomBytes(8).toString("hex")}@bots.gravae.local`,
      username: await authService.uniqueUsername(nome),
      displayName: nome,
      isBot: true,
    });

    const token = novoToken();
    const bot = await botRepository.create({
      ownerId,
      botUserId: usuario.id,
      token,
      clientSecret: randomBytes(32).toString("base64url"),
      permissoesPedidas: PEDIDO_PADRAO,
    });

    return paraDono(bot, token);
  },

  async editar(
    ownerId: string,
    botId: string,
    dados: {
      nome?: string;
      descricao?: string | null;
      avatarUrl?: string | null;
      permissoesPedidas?: string[];
      publico?: boolean;
      redirectUris?: string[];
    },
  ) {
    const bot = await botService.meuBot(ownerId, botId);

    if (dados.nome !== undefined || dados.avatarUrl !== undefined) {
      await userRepository.update(bot.botUserId, {
        ...(dados.nome !== undefined ? { displayName: dados.nome } : {}),
        ...(dados.avatarUrl !== undefined ? { avatarUrl: dados.avatarUrl } : {}),
      });
    }

    const pedidas = dados.permissoesPedidas?.filter((p): p is Permission =>
      (PERMISSIONS as readonly string[]).includes(p),
    );

    const atualizado = await botRepository.update(botId, {
      ...(dados.descricao !== undefined ? { descricao: dados.descricao } : {}),
      ...(pedidas ? { permissoesPedidas: pedidas } : {}),
      ...(dados.publico !== undefined ? { publico: dados.publico } : {}),
      ...(dados.redirectUris ? { redirectUris: dados.redirectUris.slice(0, 10) } : {}),
    });

    return paraDono(atualizado);
  },

  async regenerarToken(ownerId: string, botId: string) {
    await botService.meuBot(ownerId, botId);

    const token = novoToken();
    const bot = await botRepository.updateToken(botId, token);

    return paraDono(bot, token);
  },

  async apagar(ownerId: string, botId: string) {
    const bot = await botService.meuBot(ownerId, botId);

    await botRepository.delete(bot.id);
    await userRepository.remove(bot.botUserId);
  },

  async paraConvidar(botId: string) {
    const bot = await botRepository.findById(botId);
    if (!bot) throw new NotFoundError("Bot não encontrado");

    return paraConvite(bot);
  },

  async adicionarAoServidor(userId: string, botId: string, guildId: string) {
    const bot = await botRepository.findById(botId);
    if (!bot) throw new NotFoundError("Bot não encontrado");

    await accessService.requirePermission(userId, guildId, "MANAGE_GUILD");

    if (!bot.publico && bot.ownerId !== userId) {
      throw new ForbiddenError("Esse bot é fechado: só quem o criou pode adicioná-lo.");
    }

    const jaEsta = await memberRepository.find(guildId, bot.botUserId);
    if (jaEsta) throw new AppError("Esse bot já está nesse servidor.", 400);

    const cargo = bot.permissoesPedidas.length
      ? await roleRepository.create({
          guildId,
          name: (bot.usuario.displayName || "Bot").slice(0, 32),
          permissions: bot.permissoesPedidas,
          position: 1,
        })
      : null;

    await memberRepository.create({
      guildId,
      userId: bot.botUserId,
      roleIds: cargo ? [cargo.id] : [],
    });

    return { guildId, botId, roleId: cargo?.id ?? null };
  },

  async removerDoServidor(userId: string, botId: string, guildId: string) {
    const bot = await botRepository.findById(botId);
    if (!bot) throw new NotFoundError("Bot não encontrado");

    await accessService.requirePermission(userId, guildId, "MANAGE_GUILD");
    await memberRepository.remove(guildId, bot.botUserId);
  },

  async destinosPara(userId: string, botId: string) {
    const bot = await botRepository.findById(botId);
    if (!bot) throw new NotFoundError("Bot não encontrado");

    const [meus, ondeOBotEsta] = await Promise.all([
      memberRepository.guildIdsOf(userId),
      memberRepository.guildIdsOf(bot.botUserId),
    ]);

    const jaTem = new Set(ondeOBotEsta.map((m) => m.guildId));

    const candidatos = await Promise.all(
      meus
        .filter((m) => !jaTem.has(m.guildId))
        .map(async (m) => {
          const pode = await accessService
            .requirePermission(userId, m.guildId, "MANAGE_GUILD")
            .then(() => true)
            .catch(() => false);

          if (!pode) return null;

          const guild = await guildRepository.findById(m.guildId);
          return guild ? { id: guild.id, name: guild.name, iconUrl: guild.iconUrl } : null;
        }),
    );

    return {
      destinos: candidatos.filter((g) => g !== null),
      totalDeServidores: meus.length,
      jaEstaEm: jaTem.size,
    };
  },

  async servidoresDe(botId: string) {
    const bot = await botRepository.findById(botId);
    if (!bot) throw new NotFoundError("Bot não encontrado");

    const membros = await memberRepository.guildIdsOf(bot.botUserId);
    const guilds = await Promise.all(membros.map((m) => guildRepository.findById(m.guildId)));

    return guilds
      .filter((g) => g !== null)
      .map((g) => ({ id: g.id, name: g.name, iconUrl: g.iconUrl }));
  },

  comandosDe(bot: { comandos: unknown }): ComandoDeBot[] {
    if (!Array.isArray(bot.comandos)) return [];

    return bot.comandos.flatMap((cru) => {
      const lido = comandoDeBotSchema.safeParse(cru);
      return lido.success ? [lido.data] : [];
    });
  },

  async definirComandos(botId: string, comandos: ComandoDeBot[]) {
    const nomes = new Set<string>();

    for (const comando of comandos) {
      if (nomes.has(comando.nome)) {
        throw new AppError(`Dois comandos com o mesmo nome: /${comando.nome}`, 400);
      }
      nomes.add(comando.nome);

      const opcoes = new Set<string>();
      for (const opcao of comando.opcoes) {
        if (opcoes.has(opcao.nome)) {
          throw new AppError(`/${comando.nome} tem duas opções "${opcao.nome}"`, 400);
        }
        opcoes.add(opcao.nome);
      }

      const primeiraOpcional = comando.opcoes.findIndex((o) => !o.obrigatoria);
      if (
        primeiraOpcional >= 0 &&
        comando.opcoes.slice(primeiraOpcional).some((o) => o.obrigatoria)
      ) {
        throw new AppError(
          `Em /${comando.nome}, opção obrigatória depois de opcional: não dá para saber qual valor é de qual.`,
          400,
        );
      }
    }

    const bot = await botRepository.update(botId, { comandos });
    return botService.comandosDe(bot);
  },

  async comandosDoServidor(guildId: string) {
    const membros = await memberRepository.findManyByGuild(guildId);
    const idsDeBot = membros.filter((m) => m.user.isBot).map((m) => m.userId);

    if (!idsDeBot.length) return [];

    const bots = await botRepository.findManyByUserIds(idsDeBot);

    return bots.flatMap((bot) =>
      botService.comandosDe(bot).map((comando) => ({
        ...comando,
        botId: bot.id,
        bot: toPublicUser(bot.usuario),
      })),
    );
  },

  async resolverInvocacao(params: {
    guildId: string;
    botId: string;
    comando: string;
    opcoes: Record<string, string>;
  }) {
    const bot = await botRepository.findById(params.botId);
    if (!bot) throw new NotFoundError("Bot não encontrado");

    const membro = await memberRepository.find(params.guildId, bot.botUserId);
    if (!membro) throw new NotFoundError("Esse bot não está neste servidor");

    const comando = botService.comandosDe(bot).find((c) => c.nome === params.comando);
    if (!comando) throw new NotFoundError(`/${params.comando} não existe`);

    const declaradas = new Set(comando.opcoes.map((o) => o.nome));
    for (const nome of Object.keys(params.opcoes)) {
      if (!declaradas.has(nome)) throw new AppError(`/${comando.nome} não tem "${nome}"`, 400);
    }

    const valores: Record<string, string | number> = {};

    for (const opcao of comando.opcoes) {
      const cru = params.opcoes[opcao.nome]?.trim() ?? "";

      if (!cru) {
        if (opcao.obrigatoria) throw new AppError(`Falta "${opcao.nome}" em /${comando.nome}`, 400);
        continue;
      }

      valores[opcao.nome] = converter(opcao, cru, comando.nome);
    }

    return { bot, comando, opcoes: valores };
  },

  async resolverToken(token: string) {
    const bot = await botRepository.findByToken(token);
    if (!bot) return null;

    return { botId: bot.id, userId: bot.botUserId };
  },

  async meuBot(ownerId: string, botId: string) {
    const bot = await botRepository.findById(botId);
    if (!bot) throw new NotFoundError("Bot não encontrado");
    if (bot.ownerId !== ownerId) throw new ForbiddenError("Esse bot não é seu");

    return bot;
  },
};

const soId = (valor: string) => /^<[@#]&?([a-f\d]{24})>$/i.exec(valor)?.[1] ?? valor;

function converter(
  opcao: { nome: string; tipo: string },
  cru: string,
  comando: string,
): string | number {
  if (opcao.tipo === "numero") {
    const numero = Number(cru.replace(",", "."));
    if (!Number.isFinite(numero)) {
      throw new AppError(`"${opcao.nome}" em /${comando} precisa ser um número`, 400);
    }
    return numero;
  }

  if (opcao.tipo === "usuario" || opcao.tipo === "canal") {
    const id = soId(cru);
    if (!/^[a-f\d]{24}$/i.test(id)) {
      const oQue = opcao.tipo === "usuario" ? "uma pessoa" : "um canal";
      throw new AppError(`"${opcao.nome}" em /${comando} precisa ser ${oQue}`, 400);
    }
    return id;
  }

  return cru;
}
