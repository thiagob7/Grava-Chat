import { randomBytes } from "node:crypto";
import { AppError, NotFoundError, UnauthorizedError } from "~/lib/http.js";
import { redis, keys } from "~/lib/redis.js";
import { toMessage, toPublicUser } from "~/lib/serialize.js";
import { channelRepository } from "~/repositories/guild-repository.js";
import { messageRepository, readStateRepository } from "~/repositories/message-repository.js";
import { userRepository } from "~/repositories/user-repository.js";
import { webhookRepository } from "~/repositories/webhook-repository.js";
import { accessService } from "./access-service.js";
import { authService } from "./auth-service.js";
import type {
  CreateWebhookInput,
  ExecuteWebhookInput,
  UpdateWebhookInput,
} from "~/validations/webhook.js";

const LIMITE_POR_JANELA = 5;
const JANELA_S = 5;

const publico = (w: Awaited<ReturnType<typeof webhookRepository.findById>>, baseUrl: string) => {
  if (!w) throw new NotFoundError("Webhook não encontrado");

  return {
    id: w.id,
    guildId: w.guildId,
    channelId: w.channelId,
    name: w.name,
    avatarUrl: w.avatarUrl,
    url: `${baseUrl}/api/webhooks/${w.id}/${w.token}`,
    bot: toPublicUser(w.bot),
    createdBy: toPublicUser(w.createdBy),
    createdAt: w.createdAt.toISOString(),
  };
};

export const webhookService = {
  async list(userId: string, guildId: string, baseUrl: string) {
    await accessService.requirePermission(userId, guildId, "MANAGE_WEBHOOKS");

    const webhooks = await webhookRepository.findManyByGuild(guildId);
    return webhooks.map((w) => publico(w, baseUrl));
  },

  async create(userId: string, guildId: string, input: CreateWebhookInput, baseUrl: string) {
    await accessService.requirePermission(userId, guildId, "MANAGE_WEBHOOKS", input.channelId);

    const channel = await channelRepository.findById(input.channelId);
    if (!channel || channel.guildId !== guildId) throw new NotFoundError("Canal não encontrado");
    if (channel.type !== "TEXT" && channel.type !== "FORUM") {
      throw new AppError("Webhook só posta em canal de texto");
    }

    const bot = await userRepository.create({
      email: `webhook-${randomBytes(8).toString("hex")}@bots.gravae.local`,
      username: await authService.uniqueUsername(input.name),
      displayName: input.name,
      isBot: true,
    });

    const webhook = await webhookRepository.create({
      guildId,
      channelId: input.channelId,
      name: input.name,
      token: randomBytes(32).toString("base64url"),
      botUserId: bot.id,
      createdById: userId,
    });

    return publico(webhook, baseUrl);
  },

  async update(
    userId: string,
    guildId: string,
    webhookId: string,
    input: UpdateWebhookInput,
    baseUrl: string,
  ) {
    await accessService.requirePermission(userId, guildId, "MANAGE_WEBHOOKS");

    const atual = await webhookRepository.findById(webhookId);
    if (!atual || atual.guildId !== guildId) throw new NotFoundError("Webhook não encontrado");

    if (input.channelId) {
      const channel = await channelRepository.findById(input.channelId);
      if (!channel || channel.guildId !== guildId) throw new NotFoundError("Canal não encontrado");
      if (channel.type !== "TEXT" && channel.type !== "FORUM") {
        throw new AppError("Webhook só posta em canal de texto");
      }
    }

    if (input.name !== undefined || input.avatarUrl !== undefined) {
      await userRepository.update(atual.botUserId, {
        ...(input.name !== undefined ? { displayName: input.name } : {}),
        ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
      });
    }

    return publico(await webhookRepository.update(webhookId, input), baseUrl);
  },

  async remove(userId: string, guildId: string, webhookId: string) {
    await accessService.requirePermission(userId, guildId, "MANAGE_WEBHOOKS");

    const webhook = await webhookRepository.findById(webhookId);
    if (!webhook || webhook.guildId !== guildId) throw new NotFoundError("Webhook não encontrado");

    await webhookRepository.remove(webhookId);

    if ((await messageRepository.countByAuthor(webhook.botUserId)) === 0) {
      await userRepository.remove(webhook.botUserId);
    }
  },

  async execute(webhookId: string, token: string, input: ExecuteWebhookInput) {
    const webhook = await webhookRepository.findById(webhookId);

    if (!webhook) throw new NotFoundError("Webhook não encontrado");
    if (webhook.token !== token) throw new UnauthorizedError("Token inválido");

    const content = (input.content ?? "").trim();
    if (!content) throw new AppError("Mensagem vazia");

    const usos = await redis.incr(keys.webhookRate(webhookId));
    if (usos === 1) await redis.expire(keys.webhookRate(webhookId), JANELA_S);
    if (usos > LIMITE_POR_JANELA) throw new AppError("Muitas mensagens seguidas", 429);

    if (input.username || input.avatar_url !== undefined) {
      await userRepository.update(webhook.botUserId, {
        ...(input.username ? { displayName: input.username } : {}),
        ...(input.avatar_url !== undefined ? { avatarUrl: input.avatar_url } : {}),
      });
    }

    const created = await messageRepository.create({
      channelId: webhook.channelId,
      authorId: webhook.botUserId,
      content,
      attachments: [],
      replyToId: null,
      mentions: [],
    });

    await readStateRepository.markRead(webhook.botUserId, webhook.channelId, created.id);

    return toMessage(created, webhook.botUserId);
  },
};
