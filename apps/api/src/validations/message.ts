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

/*
  Ou se busca num servidor, ou dentro de uma conversa. Sem um dos dois não há
  onde procurar, e a checagem sai aqui em vez de virar um caso a mais no serviço.
*/
export const buscaQuery = z
  .object({
    q: z.string().trim().min(2).max(100),
    guildId: objectId.optional(),
    canalId: objectId.optional(),
    autorId: objectId.optional(),
    before: objectId.optional(),
  })
  .refine((valor) => Boolean(valor.guildId ?? valor.canalId), {
    message: "Diga em que servidor ou em que canal procurar",
    path: ["guildId"],
  });
