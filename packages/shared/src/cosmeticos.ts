import { z } from "zod";
import { connectionSchema } from "./conexoes.js";

export const NAME_FONTS = [
  "padrao",
  "serifada",
  "monoespacada",
  "titulo",
  "manuscrita",
] as const;
export type NameFont = (typeof NAME_FONTS)[number];

export const NAME_EFFECTS = [
  "solido",
  "gradiente",
  "neon",
  "brilho",
] as const;
export type NameEffect = (typeof NAME_EFFECTS)[number];

export const DECORATIONS = [
  "nenhuma",
  "alada",
  "gelo",
  "coroa",
  "runas",
  "loureiro",
  "capivara",
  "gato",
  "tucano",
  "sapo",
  "beija-flor",
  "arara",
  "preguica",
  "coruja",
  "borboleta",
  "cachorro",
] as const;
export type Decoration = (typeof DECORATIONS)[number];

export const FRAMES = [
  "nenhuma",
  "neon",
  "dourada",
  "vidro",
  "pixel",
  "espinhos",
  "prisma",
  "estelar",
  "filete",
  "rosas",
  "arabesco",
  "grega",
  "espinheiro",
] as const;
export type Frame = (typeof FRAMES)[number];

export const PROFILE_EFFECTS = [
  "nenhum",
  "poeira",
  "chuva",
  "brasas",
  "bolhas",
] as const;
export type ProfileEffect = (typeof PROFILE_EFFECTS)[number];

export const PLATES = [
  "nenhuma",
  "fita",
  "holograma",
  "carimbo",
  "cristal",
] as const;
export type Plate = (typeof PLATES)[number];

export const RANKS = ["nenhuma", "orbe"] as const;
export type Rank = (typeof RANKS)[number];

export const ROLE_STYLES = ["solido", "gradiente", "holografico"] as const;
export type RoleStyle = (typeof ROLE_STYLES)[number];

const objectIdCosmetic = z.string().regex(/^[a-f\d]{24}$/i);

export const colorHex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida");

export const nameStyleSchema = z.object({
  font: z.enum(NAME_FONTS).optional(),
  effect: z.enum(NAME_EFFECTS).optional(),
  color: colorHex.nullable().optional(),
  color2: colorHex.nullable().optional(),
});
export type NameStyle = z.infer<typeof nameStyleSchema>;

export const profileStyleSchema = z.object({
  name: nameStyleSchema.optional(),
  tag: z.string().max(6).nullable().optional(),
  rank: z.enum(RANKS).optional(),
  decoration: z.enum(DECORATIONS).optional(),
  frame: z.enum(FRAMES).optional(),
  effect: z.enum(PROFILE_EFFECTS).optional(),
  plate: z.enum(PLATES).optional(),
  tagGuildId: objectIdCosmetic.nullable().optional(),
  bannerUrl: z.string().nullable().optional(),
  bannerColor: colorHex.nullable().optional(),
  themePrimary: colorHex.nullable().optional(),
  secondaryTheme: colorHex.nullable().optional(),
  connections: z.array(connectionSchema).max(8).optional(),
});
export type ProfileStyle = z.infer<typeof profileStyleSchema>;

export const statusCustomSchema = z.object({
  text: z.string().max(96),
  emoji: z.string().max(64).nullable().optional(),
  expiresAt: z.iso.datetime().nullable().optional(),
});
export type CustomStatus = z.infer<typeof statusCustomSchema>;

export const profilePublicSchema = z.object({
  name: nameStyleSchema.optional(),
  tag: z.string().max(6).nullable().optional(),
  serverTag: z
    .object({
      guildId: objectIdCosmetic,
      tag: z.string(),
      tagIcon: z.string().nullable(),
    })
    .nullable()
    .optional(),
  badges: z.array(objectIdCosmetic).optional(),
  rank: z.enum(RANKS).optional(),
  decoration: z.enum(DECORATIONS).optional(),
  frame: z.enum(FRAMES).optional(),
  plate: z.enum(PLATES).optional(),
  status: statusCustomSchema.nullable().optional(),
  connections: z.array(connectionSchema).optional(),
});
export type ProfilePublic = z.infer<typeof profilePublicSchema>;
