import { z } from "zod";
import { sendMessageInput, editMessageInput, objectId, LIMITS } from "@gravae/shared";

export { sendMessageInput, editMessageInput };

export type SendMessageInput = z.infer<typeof sendMessageInput>;
export type EditMessageInput = z.infer<typeof editMessageInput>;

export const historyQuery = z.object({
  before: objectId.optional(),
  postId: objectId.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(LIMITS.messagePageSize),
});

/// A busca. O termo tem mínimo de 2 porque uma letra só varre tudo e não
/// diz nada; o resto é opcional e vem dos filtros da tela.
export const buscaQuery = z.object({
  q: z.string().trim().min(2).max(100),
  guildId: objectId,
  canalId: objectId.optional(),
  autorId: objectId.optional(),
  before: objectId.optional(),
});
