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

/**
 * Vazão: no máximo 5 mensagens a cada 5 segundos por webhook. Um script com um
 * laço errado consegue encher um canal em segundos, e do outro lado não tem
 * ninguém pra pedir pra parar — só o dono do servidor apagando o webhook.
 */
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
    /** a URL inteira, pronta pra colar no que vai postar */
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

  /**
   * Cada webhook nasce com um usuário-bot próprio. É esse usuário que assina as
   * mensagens — por isso nem o histórico, nem a lista de membros, nem a
   * serialização precisam de um caso especial pra webhook.
   */
  async create(userId: string, guildId: string, input: CreateWebhookInput, baseUrl: string) {
    await accessService.requirePermission(userId, guildId, "MANAGE_WEBHOOKS", input.channelId);

    const channel = await channelRepository.findById(input.channelId);
    if (!channel || channel.guildId !== guildId) throw new NotFoundError("Canal não encontrado");
    if (channel.type !== "TEXT" && channel.type !== "FORUM") {
      throw new AppError("Webhook só posta em canal de texto");
    }

    const bot = await userRepository.create({
      // e-mail interno: o model exige um, e este nunca recebe login
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

    // nome e foto vivem nos dois lugares: no webhook (o que a tela mostra) e no
    // usuário-bot (o que assina as mensagens antigas e novas)
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

    /**
     * O usuário-bot só vai embora se nunca tiver postado nada. Apagá-lo com
     * histórico levaria as mensagens junto (cascade), e "excluir webhook"
     * significa que a URL para de funcionar — não que a conversa some.
     */
    if ((await messageRepository.countByAuthor(webhook.botUserId)) === 0) {
      await userRepository.remove(webhook.botUserId);
    }
  },

  /**
   * A rota pública. Não tem login: o token na URL É a autorização, como no
   * Discord. Por isso ele vale exatamente para um canal e nada mais.
   */
  async execute(webhookId: string, token: string, input: ExecuteWebhookInput) {
    const webhook = await webhookRepository.findById(webhookId);

    // 401 e não 404 quando o token está errado: o id sozinho não prova nada
    if (!webhook) throw new NotFoundError("Webhook não encontrado");
    if (webhook.token !== token) throw new UnauthorizedError("Token inválido");

    const content = (input.content ?? "").trim();
    if (!content) throw new AppError("Mensagem vazia");

    const usos = await redis.incr(keys.webhookRate(webhookId));
    if (usos === 1) await redis.expire(keys.webhookRate(webhookId), JANELA_S);
    if (usos > LIMITE_POR_JANELA) throw new AppError("Muitas mensagens seguidas", 429);

    /**
     * `username` e `avatar_url` sobrescrevem a identidade por mensagem — é como
     * um webhook só consegue postar como "CI" numa mensagem e "Deploy" na
     * seguinte. Quando não vêm, vale o que está configurado.
     */
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

    // o bot "leu" o que ele mesmo escreveu; sem isso o canal fica com
    // não-lido eterno para a conta do bot
    await readStateRepository.markRead(webhook.botUserId, webhook.channelId, created.id);

    return toMessage(created, webhook.botUserId);
  },
};
