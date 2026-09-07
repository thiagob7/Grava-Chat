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
const dia = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "data no formato AAAA-MM-DD");

export const ESCOPOS_DE_BUSCA = ["servidor", "canal", "comunidades", "dms", "tudo"] as const;
export const TEM_NA_BUSCA = ["link", "imagem", "video", "som", "arquivo", "anexo"] as const;

export const buscaQuery = z
  .object({
    q: z.string().trim().max(100),
    escopo: z.enum(ESCOPOS_DE_BUSCA).optional(),
    guildId: objectId.optional(),
    canalId: objectId.optional(),
    autorId: objectId.optional(),
    mencionaId: objectId.optional(),
    tem: z.enum(TEM_NA_BUSCA).optional(),
    depois: dia.optional(),
    antes: dia.optional(),
    em: dia.optional(),
    fixada: z.stringbool().optional(),
    tipoDeAutor: z.enum(["usuario", "bot"]).optional(),
    ordem: z.enum(["recente", "antiga"]).optional(),
    before: objectId.optional(),
  })
  /// Sem escopo largo, precisa de um lugar: o servidor ou a conversa.
  .refine(
    (valor) =>
      ["comunidades", "dms", "tudo"].includes(valor.escopo ?? "") ||
      Boolean(valor.guildId ?? valor.canalId),
    { message: "Diga em que servidor ou em que canal procurar", path: ["guildId"] },
  )
  /// Só filtro, sem texto, vale — desde que haja algum filtro.
  .refine(
    (valor) =>
      valor.q.length >= 2 ||
      Boolean(valor.autorId ?? valor.mencionaId ?? valor.tem ?? valor.depois ?? valor.antes ?? valor.em ?? valor.fixada ?? valor.tipoDeAutor),
    { message: "Escreva ao menos duas letras, ou escolha um filtro", path: ["q"] },
  );

export type BuscaQuery = z.infer<typeof buscaQuery>;
