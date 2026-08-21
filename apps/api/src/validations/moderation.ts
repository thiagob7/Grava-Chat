import { z } from "zod";
import { objectId } from "@gravae/shared";

export const banInput = z.object({
  reason: z.string().max(512).nullable().optional(),
  /** apagar as mensagens das últimas N horas de quem foi banido */
  apagarHoras: z.number().int().min(0).max(168).optional(),
});
export type BanInput = z.infer<typeof banInput>;

export const timeoutInput = z.object({
  /** minutos de castigo; 0 solta na hora */
  minutos: z.number().int().min(0).max(60 * 24 * 28),
  reason: z.string().max(512).nullable().optional(),
});
export type TimeoutInput = z.infer<typeof timeoutInput>;

export const nicknameInput = z.object({
  nickname: z.string().min(1).max(32).nullable(),
});

export const autoModRuleInput = z.object({
  name: z.string().min(1).max(48),
  enabled: z.boolean().optional(),
  trigger: z.enum(["WORDS", "MENTION_SPAM", "LINKS"]),
  palavras: z.array(z.string().min(1).max(64)).max(200).optional(),
  limiteMencoes: z.number().int().min(2).max(50).nullable().optional(),
  acoes: z.array(z.enum(["BLOCK", "ALERT", "TIMEOUT"])).min(1),
  alertChannelId: objectId.nullable().optional(),
  timeoutSeconds: z.number().int().min(60).max(60 * 60 * 24 * 7).nullable().optional(),
  cargosIsentos: z.array(objectId).optional(),
});
export type AutoModRuleInput = z.infer<typeof autoModRuleInput>;

export const auditQuery = z.object({
  actorId: objectId.optional(),
  action: z.string().max(48).optional(),
  before: objectId.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
