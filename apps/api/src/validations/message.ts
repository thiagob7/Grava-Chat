import { z } from "zod";
import { sendMessageInput, editMessageInput, objectId, LIMITS } from "@gravae/shared";

export { sendMessageInput, editMessageInput };

export type SendMessageInput = z.infer<typeof sendMessageInput>;
export type EditMessageInput = z.infer<typeof editMessageInput>;

export const historyQuery = z.object({
  before: objectId.optional(),
  /** conversa de um assunto do fórum; sem isto, só as mensagens soltas do canal */
  postId: objectId.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(LIMITS.messagePageSize),
});
