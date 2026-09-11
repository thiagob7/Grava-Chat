import type { ThemeActive } from "./temas.js";

export interface GalleryTheme {
  id: string;
  name: string;
  description: string | null;
  author: string | null;
  version: string | null;
  tags: string[];
  overrides: Record<string, string>;
  actives: ThemeActive[];
  weightBytes: number;
  publishedBy: { id: string; displayName: string; avatarUrl: string | null };
  createdAt: string;
}

export interface AppDiscovered {
  id: string;
  name: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  categories: string[];
  description: string | null;
  permissionsRequested: string[];
  commands: number;
  owner: { id: string; displayName: string };
  createdAt: string;
}

export interface AppPublic extends AppDiscovered {
  username: string;
  userId: string;
  languages: string[];
  termsUrl: string | null;
  policyUrl: string | null;
  supportServer: { id: string; name: string; iconUrl: string | null; members: number } | null;
  servers: number;
  listCommands: { name: string; description: string }[];
  serversCommon: number;
}

export const PREVIEW_COLORS = [
  "--color-brand",
  "--background-primary",
  "--background-secondary",
  "--text-primary",
] as const;

export const APP_CATEGORIES = [
  "GAMES",
  "MUSICA",
  "MODERACAO",
  "PRODUTIVIDADE",
  "SOCIAL",
  "UTILIDADES",
  "ARTE_E_CRIACAO",
  "EDUCACAO",
  "OUTRA",
] as const;

export type AppCategory = (typeof APP_CATEGORIES)[number];

export const CATEGORIES_LIMIT = 3;
export const LANGUAGES_LIMIT = 6;
