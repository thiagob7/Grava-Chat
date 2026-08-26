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

/// O que um bot recém-criado pede: o suficiente para ler e responder num
/// canal, e nada mais. Quem quiser moderar marca as caixas na tela dele.
const PEDIDO_PADRAO: Permission[] = [
  "VIEW_CHANNEL",
  "SEND_MESSAGES",
  "READ_MESSAGE_HISTORY",
  "ADD_REACTIONS",
  "ATTACH_FILES",
];

const novoToken = () => randomBytes(32).toString("base64url");

type BotComUsuario = NonNullable<Awaited<ReturnType<typeof botRepository.findById>>>;

/// O token só sai daqui quando acabou de nascer. Depois disso a listagem não
/// o devolve mais — quem perdeu gera outro, como no Discord.
const paraDono = (bot: BotComUsuario, token?: string) => ({
  id: bot.id,
  usuario: toPublicUser(bot.usuario),
  descricao: bot.descricao,
  permissoesPedidas: bot.permissoesPedidas as Permission[],
  publico: bot.publico,
  redirectUris: bot.redirectUris,
  /// Ao contrário do token, o segredo pode voltar: ele sozinho não fala em
  /// nome de ninguém — só serve junto de um código que a pessoa autorizou.
  clientSecret: bot.clientSecret,
  createdAt: bot.createdAt.toISOString(),
  ...(token ? { token } : {}),
});

/// O que a tela de convite mostra a quem NÃO é dono: quem é o bot e o que ele
/// está pedindo. Nada de token, nada de dono.
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

    /// O e-mail é só para satisfazer a coluna única do User: bot não faz
    /// login, e nada nunca manda mensagem para este endereço.
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

    /// Um pedido com permissão inventada seria um cargo com lixo dentro.
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

    /// Apagar o usuário derruba o bot em cascata, e com ele a participação em
    /// todo servidor. As mensagens que ele mandou também vão — é o mesmo que
    /// acontece com qualquer conta apagada aqui.
    await botRepository.delete(bot.id);
    await userRepository.remove(bot.botUserId);
  },

  /// O que a tela de convite precisa saber. Aberta a qualquer pessoa logada:
  /// é o equivalente ao link do Discord, e quem tem o link vê o bot.
  async paraConvidar(botId: string) {
    const bot = await botRepository.findById(botId);
    if (!bot) throw new NotFoundError("Bot não encontrado");

    return paraConvite(bot);
  },

  /**
   * Põe o bot num servidor. Quem manda é quem está adicionando, e não o dono
   * do bot: é preciso MANAGE_GUILD no servidor de destino.
   *
   * É por isso que o convite pode circular — o link não dá poder nenhum
   * sozinho, ele só leva à tela onde quem já manda no servidor decide.
   */
  async adicionarAoServidor(userId: string, botId: string, guildId: string) {
    const bot = await botRepository.findById(botId);
    if (!bot) throw new NotFoundError("Bot não encontrado");

    await accessService.requirePermission(userId, guildId, "MANAGE_GUILD");

    if (!bot.publico && bot.ownerId !== userId) {
      throw new ForbiddenError("Esse bot é fechado: só quem o criou pode adicioná-lo.");
    }

    const jaEsta = await memberRepository.find(guildId, bot.botUserId);
    if (jaEsta) throw new AppError("Esse bot já está nesse servidor.", 400);

    /*
      O bot entra com um cargo só dele, com o que ele pediu — igual ao
      Discord. Assim as permissões ficam visíveis na tela de Cargos e podem
      ser cortadas depois sem mexer no bot, e sem precisar de uma tela
      separada só para "permissões de bot".

      Bot que não pede nada entra sem cargo: um cargo vazio só sujaria a lista
      de Cargos sem conceder coisa alguma. Ele fica com o @everyone, como
      qualquer membro.
    */
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

  /**
   * Para onde ESTA pessoa pode levar ESTE bot.
   *
   * A tela de convite precisa disso pronto do servidor: ela não tem como
   * saber onde você tem MANAGE_GUILD, e oferecer um servidor que vai recusar
   * o clique é pior do que não oferecer.
   *
   * Some quem já tem o bot e quem você não gerencia — o que sobra é o que o
   * botão "Autorizar" aceita de verdade.
   */
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
      /// Serve para a tela dizer POR QUE não há destino: "já está em todos"
      /// é uma frase diferente de "você não gerencia nenhum servidor".
      totalDeServidores: meus.length,
      jaEstaEm: jaTem.size,
    };
  },

  /// Onde este bot já está. É o "servidores mútuos" do perfil.
  async servidoresDe(botId: string) {
    const bot = await botRepository.findById(botId);
    if (!bot) throw new NotFoundError("Bot não encontrado");

    const membros = await memberRepository.guildIdsOf(bot.botUserId);
    const guilds = await Promise.all(membros.map((m) => guildRepository.findById(m.guildId)));

    return guilds
      .filter((g) => g !== null)
      .map((g) => ({ id: g.id, name: g.name, iconUrl: g.iconUrl }));
  },

  /**
   * Os comandos que este bot declara, já filtrados.
   *
   * O `Json` do banco pode ser qualquer coisa: um bot registrou antes de a
   * validação existir, um documento antigo, alguém mexeu no banco na mão. Ler
   * pelo schema descarta o que não presta em vez de deixar um comando torto
   * chegar até a lista do app.
   */
  comandosDe(bot: { comandos: unknown }): ComandoDeBot[] {
    if (!Array.isArray(bot.comandos)) return [];

    return bot.comandos.flatMap((cru) => {
      const lido = comandoDeBotSchema.safeParse(cru);
      return lido.success ? [lido.data] : [];
    });
  },

  /// A lista inteira de uma vez: apagar um comando é deixar de mandá-lo, e o
  /// bot nunca precisa lembrar o que registrou da última vez.
  async definirComandos(botId: string, comandos: ComandoDeBot[]) {
    const nomes = new Set<string>();

    for (const comando of comandos) {
      if (nomes.has(comando.nome)) {
        throw new AppError(`Dois comandos com o mesmo nome: /${comando.nome}`, 400);
      }
      nomes.add(comando.nome);

      /// Duas opções com o mesmo nome se sobrescreveriam no `Record` que o
      /// bot recebe, e a que perdesse sumiria sem aviso.
      const opcoes = new Set<string>();
      for (const opcao of comando.opcoes) {
        if (opcoes.has(opcao.nome)) {
          throw new AppError(`/${comando.nome} tem duas opções "${opcao.nome}"`, 400);
        }
        opcoes.add(opcao.nome);
      }

      /*
        Obrigatória depois de opcional não funciona.

        Quem digita escreve os valores em ordem, sem nome. Com `/lembrete
        [hora] <texto>`, uma linha só não diz se o primeiro pedaço é a hora
        que foi omitida ou o texto — não há como adivinhar, então o registro
        é recusado aqui, e não na hora de quem digita.
      */
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

  /**
   * Tudo o que se pode digitar depois da barra num servidor.
   *
   * Vem dos bots que ESTÃO lá — sair do servidor apaga os comandos da lista
   * sem precisar apagar nada, e é por isso que a origem é a lista de membros
   * e não a de bots.
   */
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

  /**
   * De "o que a pessoa digitou" para "o que o bot recebe".
   *
   * Tudo chega como texto, porque foi digitado. A conversão mora aqui, do
   * lado do servidor, e não no app: é aqui que a declaração do comando vive,
   * e é aqui que dá para recusar. O bot recebe já convertido e não repete
   * validação nenhuma — que é o ponto inteiro de existir comando de barra em
   * vez de ler texto solto.
   */
  async resolverInvocacao(params: {
    guildId: string;
    botId: string;
    comando: string;
    opcoes: Record<string, string>;
  }) {
    const bot = await botRepository.findById(params.botId);
    if (!bot) throw new NotFoundError("Bot não encontrado");

    /// Estar no servidor é o que dá direito ao comando. Sem isto, saber o id
    /// de um bot bastaria para acioná-lo de qualquer canto da plataforma.
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

  /// Quem o token representa. É o que o gateway usa para deixar o bot entrar
  /// no WebSocket sem nunca ter feito login.
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

/// `<@id>` e `<#id>` são o que o app escreve quando alguém escolhe uma pessoa
/// ou um canal na lista. O id cru também passa: um bot que constrói o comando
/// na mão não deveria precisar imitar a marcação do app.
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
