import { z } from "zod";
import { LIMITES_DO_TEMA } from "@gravae/shared";

const token = z
  .string()
  .regex(/^--[a-z0-9-]{1,60}$/i, "Só dá para trocar variável de tema")
  .max(64);

const valorDoToken = z.string().max(200);

export const publicarTemaInput = z.object({
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
