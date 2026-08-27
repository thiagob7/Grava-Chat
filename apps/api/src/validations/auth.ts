import { z } from "zod";
import { estiloDePerfilSchema, LIMITS, statusPersonalizadoSchema } from "@gravae/shared";
import { env } from "~/env.js";

export const r2Url = z
  .url()
  .refine((u) => u.startsWith(env.R2_PUBLIC_URL), "A imagem precisa ter sido enviada aqui");

export const devLoginInput = z.object({
  email: z.email(),
  displayName: z.string().min(1).max(LIMITS.displayName).optional(),
});

export const updateProfileInput = z.object({
  displayName: z.string().min(1).max(LIMITS.displayName).optional(),
  avatarUrl: r2Url.nullable().optional(),
  bio: z.string().max(LIMITS.bio).nullable().optional(),
  perfil: estiloDePerfilSchema
    .extend({ bannerUrl: r2Url.nullable().optional() })
    .nullable()
    .optional(),
  statusPersonalizado: statusPersonalizadoSchema.nullable().optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileInput>;

export const desktopStartInput = z.object({
  desafio: z.string().min(20).max(200),
});

export const desktopExchangeInput = z.object({
  codigo: z.string().min(20).max(200),
  verificador: z.string().min(20).max(200),
});
