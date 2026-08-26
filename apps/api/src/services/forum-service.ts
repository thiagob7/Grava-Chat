import { has, LIMITS } from "@gravae/shared";
import { AppError, ForbiddenError, NotFoundError } from "~/lib/http.js";
import { toMessage, toPublicUser } from "~/lib/serialize.js";
import { forumRepository } from "~/repositories/forum-repository.js";
import { messageRepository } from "~/repositories/message-repository.js";
import { accessService } from "./access-service.js";

const toPost = (
  p: Awaited<ReturnType<typeof forumRepository.findById>> & object,
) => ({
  id: p.id,
  channelId: p.channelId,
  guildId: p.guildId,
  author: toPublicUser(p.author),
  title: p.title,
  tags: p.tags,
  messageCount: p.messageCount,
  lastMessageAt: p.lastMessageAt.toISOString(),
  closedAt: p.closedAt?.toISOString() ?? null,
  createdAt: p.createdAt.toISOString(),
});

export const forumService = {
  async list(userId: string, channelId: string, params: { limit: number; before?: string }) {
    const { channel } = await accessService.requireChannelAccess(userId, channelId);
    if (channel.type !== "FORUM") throw new AppError("Este canal não é um fórum");

    const posts = await forumRepository.findManyByChannel(channelId, params);
    return { posts: posts.map(toPost), hasMore: posts.length === params.limit };
  },

  async create(
    userId: string,
    channelId: string,
    input: { title: string; content: string; tags?: string[] },
  ) {
    const { channel, contexto } = await accessService.requireChannelAccess(userId, channelId);
    if (channel.type !== "FORUM") throw new AppError("Este canal não é um fórum");
    if (!channel.guildId) throw new AppError("Fórum precisa de servidor");

    if (contexto && !has(contexto.permissions, "SEND_MESSAGES")) {
      throw new ForbiddenError("Você não pode criar assuntos neste fórum");
    }

    const post = await forumRepository.create({
      channelId,
      guildId: channel.guildId,
      authorId: userId,
      title: input.title.trim(),
      tags: input.tags ?? [],
      messageCount: 1,
    });

    const primeira = await messageRepository.create({
      channelId,
      authorId: userId,
      content: input.content.trim(),
      attachments: [],
      replyToId: null,
      mentions: [],
      postId: post.id,
    });

    return { post: toPost(post), message: toMessage(primeira, userId) };
  },

  async get(userId: string, postId: string) {
    const post = await forumRepository.findById(postId);
    if (!post) throw new NotFoundError("Assunto não encontrado");

    await accessService.requireChannelAccess(userId, post.channelId);
    return toPost(post);
  },

  async fechar(userId: string, postId: string, fechado: boolean) {
    const post = await forumRepository.findById(postId);
    if (!post) throw new NotFoundError("Assunto não encontrado");

    const { contexto } = await accessService.requireChannelAccess(userId, post.channelId);
    const podeModerar = Boolean(contexto && has(contexto.permissions, "MANAGE_MESSAGES"));

    if (post.authorId !== userId && !podeModerar) {
      throw new ForbiddenError("Só quem criou o assunto pode fechá-lo");
    }

    return toPost(await forumRepository.update(postId, { closedAt: fechado ? new Date() : null }));
  },

  async requirePostAberto(postId: string, channelId: string) {
    const post = await forumRepository.findById(postId);
    if (!post || post.channelId !== channelId) throw new NotFoundError("Assunto não encontrado");
    if (post.closedAt) throw new AppError("Este assunto está fechado");
  },

  registrarResposta(postId: string) {
    return forumRepository.registrarResposta(postId);
  },
};

export const LIMITE_TITULO = LIMITS.postTitulo;
