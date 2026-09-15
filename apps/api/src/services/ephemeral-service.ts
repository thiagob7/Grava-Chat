import { randomBytes } from "node:crypto";
import type { ComponentRow, Embed, Message, PublicUser } from "@gravae/shared";

import { AppError } from "~/lib/http.js";
import { keys, redis } from "~/lib/redis.js";

const EPHEMERAL_TTL_S = 15 * 60;

export interface StoredEphemeral {
  userId: string;
  botUserId: string;
  message: Message;
}

interface EphemeralContent {
  content?: string;
  embeds?: Embed[];
  components?: ComponentRow[];
}

const save = (stored: StoredEphemeral) =>
  redis.set(keys.ephemeralMessage(stored.message.id), JSON.stringify(stored), "EX", EPHEMERAL_TTL_S);

export const ephemeralService = {
  async create(params: { bot: PublicUser; userId: string; channelId: string } & EphemeralContent) {
    const content = (params.content ?? "").trim();
    const embeds = params.embeds ?? [];
    const components = params.components ?? [];

    if (!content && !embeds.length && !components.length) throw new AppError("Empty ephemeral reply");

    const message: Message = {
      id: randomBytes(12).toString("hex"),
      channelId: params.channelId,
      author: params.bot,
      content,
      font: null,
      kind: "USER",
      attachments: [],
      poll: null,
      embeds,
      components,
      ephemeral: true,
      sticker: null,
      reactions: [],
      mentions: [],
      mentionRoleIds: [],
      mentionEveryone: false,
      replyToId: null,
      forwarded: null,
      postId: null,
      pinnedAt: null,
      createdAt: new Date().toISOString(),
      editedAt: null,
    };

    const stored = { userId: params.userId, botUserId: params.bot.id, message };
    await save(stored);

    return stored;
  },

  async find(messageId: string) {
    const raw = await redis.get(keys.ephemeralMessage(messageId)).catch(() => null);
    return raw ? (JSON.parse(raw) as StoredEphemeral) : null;
  },

  async edit(messageId: string, botUserId: string, changes: EphemeralContent) {
    const stored = await ephemeralService.find(messageId);
    if (!stored || stored.botUserId !== botUserId) throw new AppError("Ephemeral message expired", 404);

    const message: Message = {
      ...stored.message,
      ...(changes.content !== undefined ? { content: changes.content.trim() } : {}),
      ...(changes.embeds !== undefined ? { embeds: changes.embeds } : {}),
      ...(changes.components !== undefined ? { components: changes.components } : {}),
      ...(changes.content !== undefined || changes.embeds !== undefined ? { editedAt: new Date().toISOString() } : {}),
    };

    if (!message.content && !message.embeds?.length && !message.components?.length) {
      throw new AppError("Mensagem vazia");
    }

    const next = { ...stored, message };
    await save(next);

    return next;
  },
};
