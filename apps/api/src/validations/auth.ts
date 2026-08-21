import { z } from "zod";
import { LIMITS } from "@gravae/shared";

export const devLoginInput = z.object({
  email: z.email(),
  displayName: z.string().min(1).max(LIMITS.displayName).optional(),
});

export const updateProfileInput = z.object({
  displayName: z.string().min(1).max(LIMITS.displayName).optional(),
  avatarUrl: z.string().nullable().optional(),
  bio: z.string().max(512).nullable().optional(),
});

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
