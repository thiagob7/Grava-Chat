import { z } from "zod";
import {
  estiloDePerfilSchema,
  LIMITS,
  statusPersonalizadoSchema,
} from "@gravae/shared";
import { env } from "~/env.js";

export const r2Url = z
  .url()
  .refine(
    (u) => u.startsWith(env.R2_PUBLIC_URL),
    "A imagem precisa ter sido enviada aqui",
  );

const senha = z.string().min(8, "A senha precisa de pelo menos 8 caracteres").max(128);

export const registrarInput = z.object({
  email: z.email(),
  senha,
  displayName: z.string().trim().min(1).max(LIMITS.displayName),
});

export const entrarInput = z.object({
  email: z.email(),
  senha: z.string().min(1).max(128),
});

export const esqueciInput = z.object({ email: z.email() });

export const redefinirInput = z.object({
  token: z.string().min(16).max(200),
  senha,
});

export const trocarSenhaInput = z.object({
  atual: z.string().max(128).optional(),
  nova: senha,
});

export const devLoginInput = z.object({
  email: z.email(),
  displayName: z.string().min(1).max(LIMITS.displayName).optional(),
});

export const updateProfileInput = z.object({
  displayName: z.string().min(1).max(LIMITS.displayName).optional(),
  avatarUrl: r2Url.nullable().optional(),
  bio: z.string().max(LIMITS.bio).nullable().optional(),
  pronomes: z.string().max(LIMITS.pronomes).nullable().optional(),
  perfil: estiloDePerfilSchema
    .extend({ bannerUrl: r2Url.nullable().optional() })
    .nullable()
    .optional(),
  statusPersonalizado: statusPersonalizadoSchema.nullable().optional(),

  aceitaPedidos: z.boolean().optional(),
  mostraAtividade: z.boolean().optional(),
  mostraServidoresEmComum: z.boolean().optional(),
  mostraAmigosEmComum: z.boolean().optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileInput>;

export const desktopStartInput = z.object({
  desafio: z.string().min(20).max(200),
});

export const desktopExchangeInput = z.object({
  codigo: z.string().min(20).max(200),
  verificador: z.string().min(20).max(200),
});
