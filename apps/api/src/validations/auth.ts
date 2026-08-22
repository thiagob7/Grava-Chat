import { z } from "zod";
import { estiloDePerfilSchema, LIMITS, statusPersonalizadoSchema } from "@gravae/shared";
import { env } from "~/env.js";

/**
 * URL que TEM que ser do nosso bucket.
 *
 * `avatarUrl` era `z.string()` cru: aceitava `javascript:` e qualquer endereco
 * externo — inclusive um pixel de rastreamento que carregaria pra todo mundo
 * que visse a pessoa. Buraco que ja existia; banner e icone de cargo so
 * multiplicariam a superficie.
 */
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
  bio: z.string().max(512).nullable().optional(),
  /**
   * O banner passa pelo mesmo crivo do avatar.
   *
   * No shared ele e `z.string()` porque la nao ha como saber o endereco do
   * nosso bucket — o `env` e do servidor. Entao o aperto acontece na borda de
   * escrita, que e onde importa: sem isto, um `bannerUrl` externo viraria um
   * pixel de rastreamento carregado por todo mundo que abrisse o perfil.
   */
  perfil: estiloDePerfilSchema
    .extend({ bannerUrl: r2Url.nullable().optional() })
    .nullable()
    .optional(),
  statusPersonalizado: statusPersonalizadoSchema.nullable().optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileInput>;

/** O app abre o navegador mandando só o hash do verificador. */
export const desktopStartInput = z.object({
  desafio: z.string().min(20).max(200),
});

/**
 * A troca do código do aplicativo de desktop. Os dois são base64url de 32
 * bytes; o mínimo aqui só descarta lixo antes de tocar no Redis.
 */
export const desktopExchangeInput = z.object({
  codigo: z.string().min(20).max(200),
  verificador: z.string().min(20).max(200),
});
