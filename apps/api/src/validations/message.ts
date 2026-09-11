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

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "data no formato AAAA-MM-DD");

export const SEARCH_SCOPES = ["servidor", "canal", "comunidades", "dms", "tudo"] as const;
export const HAS_SEARCH = ["link", "imagem", "video", "som", "arquivo", "anexo"] as const;

export const searchQuery = z
  .object({
    q: z.string().trim().max(100),
    scope: z.enum(SEARCH_SCOPES).optional(),
    guildId: objectId.optional(),
    channelId: objectId.optional(),
    authorId: objectId.optional(),
    mentionsId: objectId.optional(),
    has: z.enum(HAS_SEARCH).optional(),
    after: day.optional(),
    until: day.optional(),
    em: day.optional(),
    pinned: z.stringbool().optional(),
    authorKind: z.enum(["usuario", "bot"]).optional(),
    order: z.enum(["recente", "antiga"]).optional(),
    before: objectId.optional(),
  })
  .refine(
    (value) =>
      ["comunidades", "dms", "tudo"].includes(value.scope ?? "") ||
      Boolean(value.guildId ?? value.channelId),
    { message: "Diga em que servidor ou em que canal procurar", path: ["guildId"] },
  )
  .refine(
    (value) =>
      value.q.length >= 2 ||
      Boolean(value.authorId ?? value.mentionsId ?? value.has ?? value.after ?? value.before ?? value.em ?? value.pinned ?? value.authorKind),
    { message: "Escreva ao menos duas letras, ou escolha um filtro", path: ["q"] },
  );

export type SearchQuery = z.infer<typeof searchQuery>;
