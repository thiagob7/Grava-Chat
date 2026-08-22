import { randomUUID } from "node:crypto";
import { has, LIMITS } from "@gravae/shared";
import { AppError, ForbiddenError, NotFoundError } from "~/lib/http.js";
import {
  messageRepository,
  reactionRepository,
  readStateRepository,
} from "~/repositories/message-repository.js";
import { toMessage } from "~/lib/serialize.js";
import { channelRepository } from "~/repositories/guild-repository.js";
import { expressionRepository } from "~/repositories/expression-repository.js";
import { redis, keys } from "~/lib/redis.js";
import { accessService, type Contexto } from "./access-service.js";
import { autoModService } from "./automod-service.js";
import { forumService } from "./forum-service.js";
import type { EditMessageInput, SendMessageInput } from "~/validations/message.js";

/** `<@id>` é o formato de menção; o front converte o nome digitado pra isso. */
const extractMentions = (content: string) =>
  [...content.matchAll(/<@([a-f\d]{24})>/gi)].map((m) => m[1]!).filter((v, i, a) => a.indexOf(v) === i);

export const messageService = {
  async history(
    userId: string,
    channelId: string,
    params: { before?: string; limit: number; postId?: string },
  ) {
    await accessService.requireChannelAccess(userId, channelId);

    const messages = await messageRepository.findPage({ channelId, ...params });

    return {
      // devolvido em ordem cronológica: é assim que o front renderiza
      messages: messages.reverse().map((m) => toMessage(m, userId)),
      hasMore: messages.length === params.limit,
    };
  },

  async send(userId: string, input: SendMessageInput) {
    const { channel, contexto } = await accessService.requireChannelAccess(userId, input.channelId);

    /**
     * Canal de voz aceita mensagem: é o chat que fica ao lado da chamada, como
     * no Discord. Só o fórum é diferente — lá toda mensagem pertence a um post.
     */
    if (channel.type === "FORUM" && !input.postId) {
      throw new AppError("No fórum, a mensagem vai dentro de um assunto");
    }

    // assunto fechado recusa ANTES de gravar: bloquear depois já teria publicado
    if (input.postId) await forumService.requirePostAberto(input.postId, channel.id);

    if (contexto) {
      requireNaoEstaDeCastigo(contexto);

      if (!has(contexto.permissions, "SEND_MESSAGES")) {
        throw new ForbiddenError("Você não pode escrever neste canal");
      }

      if (input.attachments?.length && !has(contexto.permissions, "ATTACH_FILES")) {
        throw new ForbiddenError("Você não pode anexar arquivos neste canal");
      }

      await respeitarModoLento(userId, channel, contexto);
    }

    const content = input.content.trim();
    if (!content && !input.attachments?.length && !input.poll && !input.stickerId) {
      throw new AppError("Mensagem vazia");
    }

    // a figurinha tem que ser deste servidor: senão dava pra mandar a de outro
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

    const created = await messageRepository.create({
      channelId: input.channelId,
      authorId: userId,
      content,
      /**
       * O composite type do Mongo exige os campos presentes; no schema de
       * entrada eles são opcionais. Normalizar aqui evita que o formato do
       * transporte vaze para dentro do banco.
       */
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
      mentions: extractMentions(content),
    });

    // resposta no fórum sobe o assunto e conta a mensagem
    if (input.postId) await forumService.registrarResposta(input.postId).catch(() => undefined);

    // quem enviou obviamente já leu
    await readStateRepository.markRead(userId, input.channelId, created.id);

    return toMessage(created, userId);
  },

  async edit(userId: string, input: EditMessageInput) {
    const existing = await messageRepository.findById(input.messageId);
    if (!existing || existing.deletedAt) throw new NotFoundError("Mensagem não encontrada");
    if (existing.authorId !== userId) throw new ForbiddenError("Você só pode editar as suas mensagens");

    const content = input.content.trim();

    const updated = await messageRepository.update(input.messageId, {
      content,
      editedAt: new Date(),
      mentions: extractMentions(content),
    });

    return toMessage(updated, userId);
  },

  async remove(userId: string, messageId: string) {
    const existing = await messageRepository.findById(messageId);
    if (!existing || existing.deletedAt) throw new NotFoundError("Mensagem não encontrada");

    const { contexto } = await accessService.requireChannelAccess(userId, existing.channelId);
    const isAuthor = existing.authorId === userId;
    // moderar é permissão de canal: pode valer em #geral e não valer em #avisos
    const podeModerar = Boolean(contexto && has(contexto.permissions, "MANAGE_MESSAGES"));

    if (!isAuthor && !podeModerar) throw new ForbiddenError("Sem permissão para apagar esta mensagem");

    await messageRepository.softDelete(messageId);
    return { messageId, channelId: existing.channelId };
  },

  /**
   * Fixar é moderação, não autoria: quem escreveu não fixa a própria mensagem
   * só por ter escrito — precisa de MANAGE_MESSAGES naquele canal.
   */
  async pin(userId: string, messageId: string, fixar: boolean) {
    const existing = await messageRepository.findById(messageId);
    if (!existing || existing.deletedAt) throw new NotFoundError("Mensagem não encontrada");

    const { contexto } = await accessService.requireChannelAccess(userId, existing.channelId);
    if (contexto && !has(contexto.permissions, "MANAGE_MESSAGES")) {
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

  /** Votar ou desmarcar. Um clique na opção já marcada tira o voto. */
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
        // enquete de escolha única: votar numa opção tira o voto das outras
        return { ...o, userIds: message.poll!.multiSelect ? o.userIds : semEsteVoto };
      }

      return { ...o, userIds: jaVotou ? semEsteVoto : [...semEsteVoto, userId] };
    });

    const updated = await messageRepository.update(messageId, {
      poll: { ...message.poll, opcoes },
    });

    return toMessage(updated, userId);
  },

  /** Encerrar antes da hora: só quem criou. */
  async encerrarEnquete(userId: string, messageId: string) {
    const message = await messageRepository.findByIdWithRelations(messageId);
    if (!message.poll) throw new NotFoundError("Enquete não encontrada");
    if (message.authorId !== userId) throw new ForbiddenError("Só quem criou encerra a enquete");

    const updated = await messageRepository.update(messageId, {
      poll: { ...message.poll, closedAt: new Date() },
    });

    return toMessage(updated, userId);
  },

  async react(userId: string, messageId: string, emoji: string, add: boolean) {
    const message = await messageRepository.findById(messageId);
    if (!message || message.deletedAt) throw new NotFoundError("Mensagem não encontrada");

    const { contexto } = await accessService.requireChannelAccess(userId, message.channelId);
    if (add && contexto && !has(contexto.permissions, "ADD_REACTIONS")) {
      throw new ForbiddenError("Você não pode reagir neste canal");
    }

    if (add) await reactionRepository.add(messageId, userId, emoji);
    else await reactionRepository.remove(messageId, userId, emoji);

    return { channelId: message.channelId, reactions: await messageService.reactionsOf(messageId) };
  },

  /**
   * Devolve quem reagiu, não o "me" resolvido: o "me" depende de quem está
   * olhando, e calcular no servidor obrigaria a emitir um payload por socket.
   */
  async reactionsOf(messageId: string) {
    const rows = await reactionRepository.findManyByMessage(messageId);
    const grouped = new Map<string, string[]>();

    for (const r of rows) grouped.set(r.emoji, [...(grouped.get(r.emoji) ?? []), r.userId]);

    return [...grouped.entries()].map(([emoji, userIds]) => ({ emoji, userIds }));
  },

  async markRead(userId: string, channelId: string, messageId: string) {
    await accessService.requireChannelAccess(userId, channelId);
    await readStateRepository.markRead(userId, channelId, messageId);
  },

  async readStates(userId: string) {
    const states = await readStateRepository.findManyByUser(userId);

    /**
     * A contagem é calculada aqui, e não guardada num contador incrementado a
     * cada mensagem: incrementar exigiria escrever numa linha por MEMBRO a cada
     * mensagem enviada. Contar na leitura é uma consulta por canal com algo
     * pendente, e a lista de canais de um usuário é pequena.
     */
    return Promise.all(
      states.map(async (s) => ({
        channelId: s.channelId,
        lastReadMessageId: s.lastReadMessageId,
        unreadCount: s.lastReadMessageId
          ? await readStateRepository.countUnread(s.channelId, s.lastReadMessageId)
          : 0,
        mentionCount: s.mentionCount,
      })),
    );
  },

  get pageSize() {
    return LIMITS.messagePageSize;
  },
};

/** Quem está de castigo não escreve — nem no canal onde teria permissão. */
function requireNaoEstaDeCastigo(contexto: Contexto) {
  const ate = contexto.member?.timeoutUntil;
  if (!ate || ate <= new Date()) return;

  const minutos = Math.ceil((ate.getTime() - Date.now()) / 60_000);
  throw new ForbiddenError(`Você está de castigo neste servidor por mais ${minutos} min`);
}

/**
 * Modo lento: um contador no Redis com TTL igual ao intervalo do canal. Guardar
 * "a última mensagem de fulano" no Mongo custaria uma escrita por mensagem só
 * para isso, e o dado é descartável por natureza.
 */
async function respeitarModoLento(
  userId: string,
  channel: { id: string; slowmodeSeconds: number },
  contexto: Contexto,
) {
  if (!channel.slowmodeSeconds) return;
  // quem modera o canal passa direto, como no Discord
  if (has(contexto.permissions, "MANAGE_MESSAGES") || has(contexto.permissions, "MANAGE_CHANNELS")) {
    return;
  }

  const chave = keys.slowmode(channel.id, userId);
  const primeiro = await redis.set(chave, "1", "EX", channel.slowmodeSeconds, "NX");

  if (!primeiro) {
    const faltam = await redis.ttl(chave);
    throw new AppError(`Modo lento: espere ${Math.max(faltam, 1)}s para mandar de novo`, 429);
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
