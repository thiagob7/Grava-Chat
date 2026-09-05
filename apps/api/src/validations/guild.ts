import { z } from "zod";
import {
  CATEGORIAS_DE_COMUNIDADE,
  FONTES_DE_NOME,
  createGuildInput,
  createChannelInput,
  LIMITS,
} from "@gravae/shared";
import { r2Url } from "./auth.js";

export { createGuildInput, createChannelInput };

export type CreateGuildInput = z.infer<typeof createGuildInput>;
export type CreateChannelInput = z.infer<typeof createChannelInput>;

export const updateChannelInput = z.object({
  name: z.string().min(1).max(LIMITS.channelName).optional(),
  fonte: z.enum(FONTES_DE_NOME).optional(),
  topic: z.string().max(512).nullable().optional(),
  position: z.number().int().optional(),
  categoryId: z.string().nullable().optional(),
  slowmodeSeconds: z.number().int().min(0).max(LIMITS.modoLentoMax).optional(),
  contentVisibility: z.enum(["DEFAULT", "SPOILER", "AGE_RESTRICTED"]).optional(),
  bitrate: z.number().int().min(8000).max(96000).optional(),
  videoQuality: z.enum(["AUTO", "HD"]).optional(),
  userLimit: z.number().int().min(0).max(99).optional(),
});
export type UpdateChannelInput = z.infer<typeof updateChannelInput>;

export const updateGuildInput = z.object({
  name: z.string().min(2).max(LIMITS.guildName).optional(),
  iconUrl: z.string().nullable().optional(),
  bannerUrl: z.string().nullable().optional(),
  description: z.string().max(512).nullable().optional(),
  tag: z.string().min(1).max(4).nullable().optional(),
  tagIcon: z.string().max(16).nullable().optional(),
  systemChannelId: z.string().nullable().optional(),
  welcomeEnabled: z.boolean().optional(),
  welcomeMessage: z.string().trim().max(500).nullable().optional(),
  categoria: z.enum(CATEGORIAS_DE_COMUNIDADE).nullable().optional(),
  descobrivel: z.boolean().optional(),
});
export type UpdateGuildInput = z.infer<typeof updateGuildInput>;

export const createCategoryInput = z.object({ name: z.string().min(1).max(48) });

export const createInviteInput = z.object({
  maxUses: z.number().int().positive().nullable().optional(),
  expiresInHours: z.number().int().positive().nullable().optional(),
});

export const criarEmblemaInput = z.object({
  nome: z.string().min(1).max(LIMITS.emblemaNome),
  emoji: z.string().max(64).nullable().optional(),
  iconUrl: r2Url.nullable().optional(),
});
export type CriarEmblemaInput = z.infer<typeof criarEmblemaInput>;
