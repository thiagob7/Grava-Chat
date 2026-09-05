import { randomUUID } from "node:crypto";
import { has, LIMITS } from "@gravae/shared";
import { AppError, ForbiddenError, NotFoundError } from "~/lib/http.js";
import {
  messageRepository,
  reactionRepository,
  readStateRepository,
} from "~/repositories/message-repository.js";
import { toMessage } from "~/lib/serialize.js";
import { dmRepository } from "~/repositories/friendship-repository.js";
import { channelRepository, memberRepository } from "~/repositories/guild-repository.js";
import { expressionRepository } from "~/repositories/expression-repository.js";
import { redis, keys } from "~/lib/redis.js";
import { roleRepository } from "~/repositories/role-repository.js";
import { accessService, type Contexto } from "./access-service.js";
import { autoModService } from "./automod-service.js";
import { forumService } from "./forum-service.js";
import {
  passouDoFluxo,
  mensagemDeFluxo,
  JANELA_S as JANELA_DO_FLUXO_S,
} from "~/lib/fluxo-de-mensagens.js";
import { uploadService } from "./upload-service.js";
import type { EditMessageInput, SendMessageInput } from "~/validations/message.js";

const MENCAO_DE_USUARIO = /<@([a-f\d]{24})>/gi;
const MENCAO_DE_CARGO = /<@&([a-f\d]{24})>/gi;
const MENCAO_DE_TODOS = /@(everyone|here)\b/;

const unicos = (ids: string[]) => ids.filter((v, i, a) => a.indexOf(v) === i);

const extractMentions = (content: string) =>
  unicos([...content.matchAll(MENCAO_DE_USUARIO)].map((m) => m[1]!));

const extrairCargos = (content: string) =>
  unicos([...content.matchAll(MENCAO_DE_CARGO)].map((m) => m[1]!));

async function resolverMencoes(
  content: string,
  guildId: string | null,
  contexto: Contexto | null,
): Promise<{ mentionRoleIds: string[]; mentionEveryone: boolean }> {
  if (!guildId || !contexto) return { mentionRoleIds: [], mentionEveryone: false };

  const podeTodos = has(contexto.permissions, "MENTION_EVERYONE");
  const pedidos = extrairCargos(content);

  if (!pedidos.length) {
    return { mentionRoleIds: [], mentionEveryone: podeTodos && MENCAO_DE_TODOS.test(content) };
  }

  const cargos = await roleRepository.findManyByGuild(guildId);
  const permitidos = new Set(
    cargos.filter((c) => podeTodos || c.mentionable).map((c) => c.id),
  );

  return {
    mentionRoleIds: pedidos.filter((id) => permitidos.has(id)),
    mentionEveryone: podeTodos && MENCAO_DE_TODOS.test(content),
  };
}

export const messageService = {
  async history(
    userId: string,
    channelId: string,
    params: { before?: string; limit: number; postId?: string },
  ) {
    const { contexto } = await accessService.requireChannelAccess(userId, channelId);

    if (contexto && !has(contexto.permissions, "READ_MESSAGE_HISTORY")) {
      return { messages: [], hasMore: false, semHistorico: true as const };
    }

    const messages = await messageRepository.findPage({ channelId, ...params });

    return {
      messages: messages.reverse().map((m) => toMessage(m, userId)),
      hasMore: messages.length === params.limit,
      semHistorico: false as const,
    };
  },

  async buscar(
    userId: string,
    params: { guildId?: string; termo: string; canalId?: string; autorId?: string; before?: string },
  ) {
    /*
      Sem servidor, a busca é dentro de uma conversa só — e o acesso a ela é a
      mesma pergunta que se faz para abrir o canal.
    */
    const canais = params.guildId
      ? await accessService.readableChannels(userId, params.guildId)
      : await accessService
          .requireChannelAccess(userId, params.canalId!)
          .then(({ channel }) => [channel.id]);

    const linhas = await messageRepository.buscar({
      channelIds: canais,
      termo: params.termo,
      canalId: params.canalId,
      autorId: params.autorId,
      before: params.before,
      limit: 25,
    });

    return {
      messages: linhas.map((m) => ({
        ...toMessage(m, userId),
        channelName: m.channel.name,
        channelType: m.channel.type,
      })),
      hasMore: linhas.length === 25,
    };
  },

  async send(userId: string, input: SendMessageInput) {
    const { channel, contexto } = await accessService.requireChannelAccess(userId, input.channelId);

    if (channel.type === "FORUM" && !input.postId) {
      throw new AppError("No fórum, a mensagem vai dentro de um assunto");
    }

    if (input.postId) await forumService.requirePostAberto(input.postId, channel.id);

    if (contexto) {
      requireNaoEstaDeCastigo(contexto);

      if (!has(contexto.permissions, "SEND_MESSAGES")) {
        throw new ForbiddenError("Você não pode escrever neste canal");
      }

      if (input.attachments?.length && !has(contexto.permissions, "ATTACH_FILES")) {
        throw new ForbiddenError("Você não pode anexar arquivos neste canal");
      }

      if (input.poll && !has(contexto.permissions, "CREATE_POLLS")) {
        throw new ForbiddenError("Você não pode criar enquetes neste canal");
      }

      await respeitarModoLento(userId, channel, contexto);
    }

    await garantirFluxo(userId);

    const content = input.content.trim();
    if (!content && !input.attachments?.length && !input.poll && !input.stickerId) {
      throw new AppError("Mensagem vazia");
    }

    if (input.stickerId) {
      const figurinha = await expressionRepository.findStickerById(input.stickerId);
      if (!figurinha || figurinha.guildId !== channel.guildId) {
        throw new NotFoundError("Figurinha não encontrada");
      }
    }

    if (channel.guildId && contexto) {
      await autoModService.avaliar({
        guildId: channel.guildId,
        channelId: channel.id,
        userId,
        contexto,
        content,
      });
    }

    const autorRespondido =
      input.mencionarAutor && input.replyToId
        ? await messageRepository
            .findById(input.replyToId)
            .then((m) => (m && m.authorId !== userId ? m.authorId : null))
            .catch(() => null)
        : null;

    const created = await messageRepository.create({
      channelId: input.channelId,
      authorId: userId,
      content,
      ...(input.fonte && input.fonte !== "padrao" ? { fonte: input.fonte } : {}),
      attachments: (input.attachments ?? []).map((a) => ({
        ...a,
        width: a.width ?? null,
        height: a.height ?? null,
        spoiler: a.spoiler ?? false,
        description: a.description ?? null,
      })),
      ...(input.poll ? { poll: montarEnquete(input.poll) } : {}),
      ...(input.stickerId ? { stickerId: input.stickerId } : {}),
      ...(input.postId ? { postId: input.postId } : {}),
      replyToId: input.replyToId ?? null,
      mentions: unicos([
        ...extractMentions(content),
        ...(autorRespondido ? [autorRespondido] : []),
      ]),
      ...(await resolverMencoes(content, channel.guildId, contexto)),
    });

    if (input.postId) await forumService.registrarResposta(input.postId).catch(() => undefined);

    await readStateRepository.markRead(userId, input.channelId, created.id);

    return toMessage(created, userId);
  },

  async edit(userId: string, input: EditMessageInput) {
    const existing = await messageRepository.findById(input.messageId);
    if (!existing || existing.deletedAt) throw new NotFoundError("Mensagem não encontrada");
    if (existing.authorId !== userId) throw new ForbiddenError("Você só pode editar as suas mensagens");

    const content = input.content.trim();

    const { contexto } = await accessService.requireChannelAccess(userId, existing.channelId);
    const canal = await channelRepository.findById(existing.channelId);

    const updated = await messageRepository.update(input.messageId, {
      content,
      editedAt: new Date(),
      mentions: extractMentions(content),
      ...(await resolverMencoes(content, canal?.guildId ?? null, contexto)),
    });

    return toMessage(updated, userId);
  },

  async remove(userId: string, messageId: string) {
    const existing = await messageRepository.findById(messageId);
    if (!existing || existing.deletedAt) throw new NotFoundError("Mensagem não encontrada");

    const { contexto } = await accessService.requireChannelAccess(userId, existing.channelId);
    const isAuthor = existing.authorId === userId;
    const podeModerar = Boolean(contexto && has(contexto.permissions, "MANAGE_MESSAGES"));

    if (!isAuthor && !podeModerar) throw new ForbiddenError("Sem permissão para apagar esta mensagem");

    await messageRepository.softDelete(messageId);

    void uploadService.remover(existing.attachments.map((a) => a.id));

    return { messageId, channelId: existing.channelId };
  },

  /*
    Tira um anexo de uma mensagem que já saiu. Se ele era a única coisa ali —
    sem texto, sem enquete, sem figurinha — a mensagem vai junto: sobraria um
    balão vazio na conversa.
  */
  async removerAnexo(userId: string, messageId: string, anexoId: string) {
    const existing = await messageRepository.findById(messageId);
    if (!existing || existing.deletedAt) throw new NotFoundError("Mensagem não encontrada");

    const alvo = existing.attachments.find((a) => a.id === anexoId);
    if (!alvo) throw new NotFoundError("Anexo não encontrado");

    const { contexto } = await accessService.requireChannelAccess(userId, existing.channelId);
    const ehAutor = existing.authorId === userId;
    const podeModerar = Boolean(contexto && has(contexto.permissions, "MANAGE_MESSAGES"));

    if (!ehAutor && !podeModerar) {
      throw new ForbiddenError("Sem permissão para mexer nesta mensagem");
    }

    const restantes = existing.attachments.filter((a) => a.id !== anexoId);
    const ficouVazia =
      restantes.length === 0 &&
      !existing.content?.trim() &&
      !existing.poll &&
      !existing.stickerId;

    void uploadService.remover([anexoId]);

    if (ficouVazia) {
      await messageRepository.softDelete(messageId);
      return { apagouAMensagem: true as const, channelId: existing.channelId, messageId };
    }

    await messageRepository.update(messageId, { attachments: { set: restantes } });

    const atualizada = await messageRepository.findByIdWithRelations(messageId);

    return {
      apagouAMensagem: false as const,
      channelId: existing.channelId,
      message: toMessage(atualizada!, userId),
    };
  },

  async pin(userId: string, messageId: string, fixar: boolean) {
    const existing = await messageRepository.findById(messageId);
    if (!existing || existing.deletedAt) throw new NotFoundError("Mensagem não encontrada");

    const { contexto } = await accessService.requireChannelAccess(userId, existing.channelId);

    const podeFixar =
      has(contexto?.permissions ?? new Set(), "PIN_MESSAGES") ||
      has(contexto?.permissions ?? new Set(), "MANAGE_MESSAGES");

    if (contexto && !podeFixar) {
      throw new ForbiddenError("Você não pode fixar mensagens neste canal");
    }

    if (fixar) {
      const fixadas = await messageRepository.countPinned(existing.channelId);
      if (fixadas >= LIMITS.mensagensFixadas) {
        throw new AppError(`O canal já tem ${LIMITS.mensagensFixadas} mensagens fixadas`);
      }
    }

    const updated = await messageRepository.update(messageId, {
      pinnedAt: fixar ? new Date() : null,
      pinnedById: fixar ? userId : null,
    });

    return toMessage(updated, userId);
  },

  async pinned(userId: string, channelId: string) {
    await accessService.requireChannelAccess(userId, channelId);

    const mensagens = await messageRepository.findPinned(channelId);
    return mensagens.map((m) => toMessage(m, userId));
  },

  async votar(userId: string, messageId: string, optionId: string) {
    const message = await messageRepository.findByIdWithRelations(messageId);
    if (!message.poll || message.deletedAt) throw new NotFoundError("Enquete não encontrada");

    await accessService.requireChannelAccess(userId, message.channelId);

    const fechada =
      message.poll.closedAt !== null ||
      (message.poll.expiresAt !== null && message.poll.expiresAt < new Date());
    if (fechada) throw new AppError("Esta enquete já encerrou");

    const jaVotou = message.poll.opcoes.some(
      (o) => o.id === optionId && o.userIds.includes(userId),
    );

    const opcoes = message.poll.opcoes.map((o) => {
      const semEsteVoto = o.userIds.filter((id) => id !== userId);

      if (o.id !== optionId) {
        return { ...o, userIds: message.poll!.multiSelect ? o.userIds : semEsteVoto };
      }

      return { ...o, userIds: jaVotou ? semEsteVoto : [...semEsteVoto, userId] };
    });

    const updated = await messageRepository.update(messageId, {
      poll: { ...message.poll, opcoes },
    });

    return toMessage(updated, userId);
  },

  async encerrarEnquete(userId: string, messageId: string) {
    const message = await messageRepository.findByIdWithRelations(messageId);
    if (!message.poll) throw new NotFoundError("Enquete não encontrada");
    if (message.authorId !== userId) throw new ForbiddenError("Só quem criou encerra a enquete");

    const updated = await messageRepository.update(messageId, {
      poll: { ...message.poll, closedAt: new Date() },
    });

    return toMessage(updated, userId);
  },

  async react(userId: string, messageId: string, emoji: string, add: boolean, burst = false) {
    const message = await messageRepository.findById(messageId);
    if (!message || message.deletedAt) throw new NotFoundError("Mensagem não encontrada");

    const { contexto } = await accessService.requireChannelAccess(userId, message.channelId);
    if (add && contexto && !has(contexto.permissions, "ADD_REACTIONS")) {
      throw new ForbiddenError("Você não pode reagir neste canal");
    }

    if (add) await reactionRepository.add(messageId, userId, emoji, burst);
    else await reactionRepository.remove(messageId, userId, emoji);

    return { channelId: message.channelId, reactions: await messageService.reactionsOf(messageId) };
  },

  async reactionsOf(messageId: string) {
    const rows = await reactionRepository.findManyByMessage(messageId);
    const grouped = new Map<string, { userIds: string[]; burst: boolean }>();

    for (const r of rows) {
      const entry = grouped.get(r.emoji) ?? { userIds: [], burst: false };
      entry.userIds.push(r.userId);
      if (r.burst) entry.burst = true;
      grouped.set(r.emoji, entry);
    }

    return [...grouped.entries()].map(([emoji, v]) => ({ emoji, userIds: v.userIds, burst: v.burst }));
  },

  async markRead(userId: string, channelId: string, messageId: string) {
    await accessService.requireChannelAccess(userId, channelId);
    await readStateRepository.markRead(userId, channelId, messageId);
  },

  async markUnread(userId: string, channelId: string, messageId: string) {
    await accessService.requireChannelAccess(userId, channelId);

    const anterior = await messageRepository.findPreviousIn(channelId, messageId);
    await readStateRepository.markRead(userId, channelId, anterior?.id ?? null);
  },

  async mentions(userId: string) {
    const [guildIds, dms] = await Promise.all([
      memberRepository.guildIdsOf(userId),
      dmRepository.findManyForUser(userId),
    ]);

    const canaisDeServidor = await channelRepository.idsByGuilds(guildIds.map((g) => g.guildId));
    const channelIds = [...canaisDeServidor.map((c) => c.id), ...dms.map((d) => d.id)];
    if (!channelIds.length) return [];

    const desde = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const mensagens = await messageRepository.findMentions(userId, channelIds, desde);

    const canais = await channelRepository.findManyByIds([
      ...new Set(mensagens.map((m) => m.channelId)),
    ]);
    const porCanal = new Map(canais.map((c) => [c.id, c]));

    return mensagens.map((m) => ({
      ...toMessage(m, userId),
      canal: {
        id: m.channelId,
        nome: porCanal.get(m.channelId)?.name ?? "conversa",
        guildId: porCanal.get(m.channelId)?.guildId ?? null,
      },
    }));
  },

  async readStates(userId: string) {
    const states = await readStateRepository.findManyByUser(userId);

    const memberships = await memberRepository.membershipsOf(userId);
    const meusCargos = [...new Set(memberships.flatMap((m) => m.roleIds))];

    const canais = await channelRepository.guildIdsOf(states.map((s) => s.channelId));
    const dadosDoCanal = new Map(canais.map((c) => [c.id, c]));

    const lidos = await Promise.all(
      states.map(async (s) => ({
        channelId: s.channelId,
        guildId: dadosDoCanal.get(s.channelId)?.guildId ?? null,
        channelName: dadosDoCanal.get(s.channelId)?.name ?? null,
        lastReadMessageId: s.lastReadMessageId,
        unreadCount: s.lastReadMessageId
          ? await readStateRepository.countUnread(s.channelId, s.lastReadMessageId)
          : 0,
        mentionCount: s.lastReadMessageId
          ? await readStateRepository.countMentions(
              s.channelId,
              s.lastReadMessageId,
              userId,
              meusCargos,
            )
          : 0,
      })),
    );

    const nunca = await mencoesEmCanalNuncaAberto(
      userId,
      new Set(states.map((s) => s.channelId)),
      memberships,
      meusCargos,
    );

    return [...lidos, ...nunca];
  },

  get pageSize() {
    return LIMITS.messagePageSize;
  },
};

async function mencoesEmCanalNuncaAberto(
  userId: string,
  jaTemEstado: Set<string>,
  memberships: { guildId: string; roleIds: string[]; joinedAt: Date }[],
  meusCargos: string[],
) {
  if (!memberships.length) return [];

  const visiveis = await accessService.listenableChannels(
    userId,
    memberships.map((m) => m.guildId),
  );

  const novos = visiveis.filter((id) => !jaTemEstado.has(id));
  if (!novos.length) return [];

  const canais = await channelRepository.guildIdsOf(novos);
  const entrada = new Map(memberships.map((m) => [m.guildId, m.joinedAt]));

  const porServidor = new Map<string, string[]>();
  for (const canal of canais) {
    if (!canal.guildId || !entrada.has(canal.guildId)) continue;
    porServidor.set(canal.guildId, [...(porServidor.get(canal.guildId) ?? []), canal.id]);
  }

  const contagens = await Promise.all(
    [...porServidor].map(([guildId, ids]) =>
      readStateRepository.mentionsSince(ids, entrada.get(guildId)!, userId, meusCargos),
    ),
  );

  const porId = new Map(canais.map((c) => [c.id, c]));

  return contagens.flatMap((parcial) =>
    [...parcial].map(([channelId, mentionCount]) => ({
      channelId,
      guildId: porId.get(channelId)?.guildId ?? null,
      channelName: porId.get(channelId)?.name ?? null,
      lastReadMessageId: null as string | null,
      unreadCount: 0,
      mentionCount,
    })),
  );
}

function requireNaoEstaDeCastigo(contexto: Contexto) {
  const ate = contexto.member?.timeoutUntil;
  if (!ate || ate <= new Date()) return;

  const minutos = Math.ceil((ate.getTime() - Date.now()) / 60_000);
  throw new ForbiddenError(`Você está de castigo neste servidor por mais ${minutos} min`);
}

async function respeitarModoLento(
  userId: string,
  channel: { id: string; slowmodeSeconds: number },
  contexto: Contexto,
) {
  if (!channel.slowmodeSeconds) return;

  if (
    has(contexto.permissions, "BYPASS_SLOWMODE") ||
    has(contexto.permissions, "MANAGE_MESSAGES") ||
    has(contexto.permissions, "MANAGE_CHANNELS")
  ) {
    return;
  }

  const chave = keys.slowmode(channel.id, userId);
  const primeiro = await redis.set(chave, "1", "EX", channel.slowmodeSeconds, "NX");

  if (!primeiro) {
    const faltam = await redis.ttl(chave);
    throw new AppError(`Modo lento: espere ${Math.max(faltam, 1)}s para mandar de novo`, 429);
  }
}

async function garantirFluxo(userId: string) {
  const chave = keys.fluxoDeMensagens(userId);

  const usos = await redis.incr(chave);
  if (usos === 1) await redis.expire(chave, JANELA_DO_FLUXO_S);

  if (passouDoFluxo(usos)) {
    throw new AppError(mensagemDeFluxo(await redis.ttl(chave)), 429);
  }
}

function montarEnquete(input: NonNullable<SendMessageInput["poll"]>) {
  return {
    pergunta: input.pergunta.trim(),
    opcoes: input.opcoes.map((o) => ({
      id: randomUUID(),
      texto: o.texto.trim(),
      emoji: o.emoji ?? null,
      userIds: [],
    })),
    multiSelect: input.multiSelect ?? false,
    expiresAt: input.duracaoHoras ? new Date(Date.now() + input.duracaoHoras * 3600_000) : null,
    closedAt: null,
  };
}
