import { z } from "zod";
import { LIMITE_DE_ATIVOS, LIMITES_DO_TEMA } from "@gravae/shared";

const token = z
  .string()
  .regex(/^--[a-z0-9-]{1,60}$/i, "Só dá para trocar variável de tema")
  .max(64);

const valorDoToken = z.string().max(200);

const ativo = z.object({
  nome: z.string().trim().min(1).max(120),
  url: z.url().max(500),
  tipo: z.string().max(80).optional(),
  bytes: z.number().int().nonnegative().max(50 * 1024 * 1024).optional(),
});

export const publicarTemaInput = z.object({
  ativos: z.array(ativo).max(LIMITE_DE_ATIVOS).default([]),
  css: z.string().max(LIMITES_DO_TEMA.css).default(""),
  substituicoes: z
    .record(token, valorDoToken)
    .refine(
      (mapa) => Object.keys(mapa).length <= LIMITES_DO_TEMA.substituicoes,
      `No máximo ${LIMITES_DO_TEMA.substituicoes} tokens`,
    )
    .default({}),
  nome: z.string().trim().min(1).max(LIMITES_DO_TEMA.nome).optional(),
});

export type PublicarTemaInput = z.infer<typeof publicarTemaInput>;
