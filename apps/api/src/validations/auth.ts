import { z } from "zod";
import {
  profileStyleSchema,
  SPAM_FILTERS,
  LIMITS,
  statusCustomSchema,
} from "@gravae/shared";
import { env } from "~/env.js";

export const r2Url = z
  .url()
  .refine(
    (u) => u.startsWith(env.R2_PUBLIC_URL),
    "A imagem precisa ter sido enviada aqui",
  );

const password = z.string().min(8, "A senha precisa de pelo menos 8 caracteres").max(128);

export const registerInput = z.object({
  email: z.email(),
  password,
  displayName: z.string().trim().min(1).max(LIMITS.displayName),
});

export const joinInput = z.object({
  email: z.email(),
  password: z.string().min(1).max(128),
});

export const forgotInput = z.object({ email: z.email() });

export const resetInput = z.object({
  token: z.string().min(16).max(200),
  password,
});

export const swapPasswordInput = z.object({
  current: z.string().max(128).optional(),
  fresh: password,
});

export const devLoginInput = z.object({
  email: z.email(),
  displayName: z.string().min(1).max(LIMITS.displayName).optional(),
});

export const updateProfileInput = z.object({
  displayName: z.string().min(1).max(LIMITS.displayName).optional(),
  avatarUrl: r2Url.nullable().optional(),
  bio: z.string().max(LIMITS.bio).nullable().optional(),
  pronouns: z.string().max(LIMITS.pronouns).nullable().optional(),
  profile: profileStyleSchema
    .extend({ bannerUrl: r2Url.nullable().optional() })
    .nullable()
    .optional(),
  customStatus: statusCustomSchema.nullable().optional(),

  acceptedRequests: z.boolean().optional(),
  showsActivity: z.boolean().optional(),
  showsServersCommon: z.boolean().optional(),
  showsFriendsCommon: z.boolean().optional(),
  membersAllowDm: z.boolean().optional(),
  spamFilter: z.enum(SPAM_FILTERS).optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileInput>;

/*
  `desafio` é o nome que a casca de antes da virada para o inglês manda, e ela
  segue instalada na máquina de quem não reconstruiu. Sai daqui quando não
  restar nenhuma.
*/
const challenge = z.string().min(20).max(200);

export const desktopStartInput = z.union([
  z.object({ challenge }),
  z.object({ desafio: challenge }).transform((query) => ({ challenge: query.desafio })),
]);

export const desktopExchangeInput = z.object({
  code: z.string().min(20).max(200),
  verifier: z.string().min(20).max(200),
});
