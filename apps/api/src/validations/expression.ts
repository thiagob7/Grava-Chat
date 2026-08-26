import { z } from "zod";
import { LIMITS } from "@gravae/shared";

const nomeDeEmoji = z
  .string()
  .min(2)
  .max(32)
  .regex(/^[a-zA-Z0-9_]+$/, "Use só letras, números e _");

export const createEmojiInput = z.object({
  name: nomeDeEmoji,
  url: z.string().url(),
  animated: z.boolean().optional(),
});
export type CreateEmojiInput = z.infer<typeof createEmojiInput>;

export const updateEmojiInput = z.object({ name: nomeDeEmoji });

export const createStickerInput = z.object({
  name: z.string().min(2).max(30),
  description: z.string().max(100).nullable().optional(),
  relatedEmoji: z.string().min(1).max(16),
  url: z.string().url(),
  size: z.number().int().positive().max(LIMITS.figurinhaBytes),
});
export type CreateStickerInput = z.infer<typeof createStickerInput>;

export const updateStickerInput = z.object({
  name: z.string().min(2).max(30).optional(),
  description: z.string().max(100).nullable().optional(),
  relatedEmoji: z.string().min(1).max(16).optional(),
});

export const createSoundInput = z.object({
  name: z.string().min(1).max(32),
  emoji: z.string().max(16).nullable().optional(),
  url: z.string().url(),
  volume: z.number().min(0).max(1).optional(),
  size: z.number().int().positive().max(LIMITS.somBytes),
});
export type CreateSoundInput = z.infer<typeof createSoundInput>;

export const updateSoundInput = z.object({
  name: z.string().min(1).max(32).optional(),
  emoji: z.string().max(16).nullable().optional(),
  volume: z.number().min(0).max(1).optional(),
});
