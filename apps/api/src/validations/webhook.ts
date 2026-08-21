import { z } from "zod";
import { objectId, LIMITS } from "@gravae/shared";

export const createWebhookInput = z.object({
  name: z.string().min(1).max(48),
  channelId: objectId,
});
export type CreateWebhookInput = z.infer<typeof createWebhookInput>;

export const updateWebhookInput = z.object({
  name: z.string().min(1).max(48).optional(),
  channelId: objectId.optional(),
  avatarUrl: z.string().nullable().optional(),
});
export type UpdateWebhookInput = z.infer<typeof updateWebhookInput>;

/**
 * O corpo que entra pela URL pública. Os nomes em snake_case são de propósito:
 * é o formato do Discord, então script que já existe por aí funciona sem
 * adaptação.
 */
export const executeWebhookInput = z.object({
  content: z.string().max(LIMITS.messageLength).optional(),
  username: z.string().min(1).max(48).optional(),
  avatar_url: z.string().url().nullable().optional(),
});
export type ExecuteWebhookInput = z.infer<typeof executeWebhookInput>;
