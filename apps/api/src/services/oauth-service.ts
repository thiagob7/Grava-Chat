import { randomBytes, timingSafeEqual } from "node:crypto";

import { has, type Permission } from "@gravae/shared";
import { AppError, ForbiddenError, NotFoundError, UnauthorizedError } from "~/lib/http.js";
import { keys, redis } from "~/lib/redis.js";
import { toPublicUser } from "~/lib/serialize.js";
import { botRepository } from "~/repositories/bot-repository.js";
import { guildRepository, memberRepository } from "~/repositories/guild-repository.js";
import { userRepository } from "~/repositories/user-repository.js";
import { accessService } from "~/services/access-service.js";

/// Curto de propósito: o código só precisa sobreviver ao redirecionamento do
/// navegador até o servidor do dev. Se demorar mais que isso, algo deu errado.
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
  /*
    Quando a pessoa autorizou. Opcional porque tokens emitidos antes desta
    lista existir não têm o campo — eles continuam valendo até vencer, e a
    tela só não sabe dizer a data deles.
  */
  criadoEm?: number;
}

/// Comparação que não vaza o segredo pelo tempo de resposta. Com `===`, um
/// atacante descobre o prefixo certo medindo quanto cada tentativa demora.
function iguais(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);

  return x.length === y.length && timingSafeEqual(x, y);
}

export const oauthService = {
  /**
   * O que a tela de autorização mostra antes de a pessoa decidir.
   *
   * A `redirect_uri` é conferida AQUI, e não só na troca: se ela não estiver
   * na lista do bot, a tela nem chega a aparecer — é o que impede alguém de
   * montar um link com o endereço dele e colher os códigos.
   */
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

  /// A pessoa clicou em autorizar. O código vive no Redis e morre no primeiro
  /// resgate — é de uso único, como o do login do desktop.
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

  /**
   * A troca que acontece no servidor do dev, nunca no navegador.
   *
   * Pede o `clientSecret` porque o código sozinho não basta: ele viaja pela
   * barra de endereços e pode ser lido no caminho. O segredo prova que quem
   * está trocando é o dono da aplicação.
   */
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

    /// O código nasceu para OUTRA aplicação, ou para outro endereço de
    /// retorno. Os dois casos são tentativa de desvio.
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

    /*
      O token e o índice da pessoa nascem juntos, num pipeline só: um token
      fora do índice é um acesso que ninguém consegue ver nem revogar, e é
      exatamente o buraco que esta lista existe para fechar.

      O `expire` no conjunto é renovado a cada autorização de propósito — ele
      só precisa sobreviver ao token mais novo que guarda. Sem isso, o Redis
      ficaria com um conjunto por pessoa para sempre, cheio de token morto.
    */
    await redis
      .multi()
      .set(keys.oauthToken(token), JSON.stringify(guardado), "EX", TOKEN_TTL)
      .sadd(keys.oauthDaPessoa(codigo.userId), token)
      .expire(keys.oauthDaPessoa(codigo.userId), TOKEN_TTL)
      .exec();

    return { access_token: token, token_type: "Bearer", expires_in: TOKEN_TTL, scope: codigo.escopos.join(" ") };
  },

  /**
   * Quais aplicações têm acesso à conta, agrupadas por aplicação.
   *
   * Agrupadas porque o token é detalhe de implementação: quem autoriza duas
   * vezes o mesmo painel — trocou de máquina, refez o login — tem dois tokens
   * vivos, e ver "Meu Painel" duas vezes na lista não ajuda ninguém a decidir
   * o que revogar.
   *
   * A varrida aproveita para PODAR: token que venceu some da chave sozinho,
   * mas continua no conjunto. Sem esta limpeza, o índice só cresce, e uma
   * aplicação já vencida ficaria pra sempre na tela dizendo que tem acesso.
   */
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

      /// Token que não é desta pessoa não pode ter entrado aqui. Se entrou,
      /// é sujeira — e devolvê-lo mostraria o acesso de outra conta.
      if (dados.userId !== userId) return mortos.push(token);

      vivos.push(dados);
    });

    if (mortos.length) await redis.srem(chave, ...mortos);
    if (!vivos.length) return [];

    /// Um bot por aplicação, e a mesma aplicação pode aparecer em vários
    /// tokens: os escopos somam e a data é a da autorização mais recente.
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

        /// Aplicação apagada com token ainda vivo. Não dá pra desenhar um
        /// cartão sem nome nem avatar, e o acesso morre com o TTL.
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

  /**
   * Tirar o acesso de uma aplicação.
   *
   * Apaga TODOS os tokens dela, e não só um: revogar pela metade é pior que
   * não revogar, porque a tela diz que acabou e o painel do dev continua
   * respondendo com o token da outra máquina.
   */
  async revogarAplicacao(userId: string, botId: string) {
    const chave = keys.oauthDaPessoa(userId);
    const tokens = await redis.smembers(chave);
    if (!tokens.length) throw new NotFoundError("Essa aplicação não tem acesso à sua conta");

    const brutos = await redis.mget(tokens.map((t) => keys.oauthToken(t)));

    const alvos = tokens.filter((_, i) => {
      const bruto = brutos[i];
      if (!bruto) return false;

      const dados = JSON.parse(bruto) as TokenGuardado;

      /// O `userId` entra na comparação junto com o bot: o id da aplicação é
      /// público, e sem ele um pedido forjado derrubaria a autorização de
      /// outra pessoa se o token tivesse escorregado pro índice errado.
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

  /**
   * Os servidores da pessoa, com o que ela pode fazer em cada um.
   *
   * `gerencia` é o campo que o painel do dev realmente usa: é ele que separa
   * "servidor que aparece na lista para configurar" de "servidor onde a
   * pessoa só conversa".
   */
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

        /// Se o bot DESTA aplicação já está lá. Poupa o painel de descobrir
        /// isso servidor por servidor só para desenhar "Configurar" em vez de
        /// "Adicionar" — é a primeira coisa que toda dashboard precisa.
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
