import { z } from "zod";
import { ACTIVE_LIMIT, THEME_LIMITS } from "@gravae/shared";

const token = z
  .string()
  .regex(/^--[a-z0-9-]{1,60}$/i, "Só dá para trocar variável de tema")
  .max(64);

const tokenValue = z.string().max(200);

const active = z.object({
  name: z.string().trim().min(1).max(120),
  url: z.url().max(500),
  kind: z.string().max(80).optional(),
  bytes: z.number().int().nonnegative().max(50 * 1024 * 1024).optional(),
});

export const publishThemeInput = z.object({
  actives: z.array(active).max(ACTIVE_LIMIT).default([]),
  css: z.string().max(THEME_LIMITS.css).default(""),
  overrides: z
    .record(token, tokenValue)
    .refine(
      (map) => Object.keys(map).length <= THEME_LIMITS.overrides,
      `No máximo ${THEME_LIMITS.overrides} tokens`,
    )
    .default({}),
  name: z.string().trim().min(1).max(THEME_LIMITS.name).optional(),
});

export type PublishThemeInput = z.infer<typeof publishThemeInput>;
