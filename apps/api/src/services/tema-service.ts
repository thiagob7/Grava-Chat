import {
  readThemeHeader,
  themeWeight,
  type ThemeActive,
  type ThemeShared,
  type GalleryTheme,
} from "@gravae/shared";

import { THEME_PATH } from "@gravae/shared";
import { env } from "~/env.js";
import { systemService } from "~/services/sistema-service.js";
import { officialService } from "~/services/oficial-service.js";
import { AppError, NotFoundError } from "~/lib/http.js";
import { prisma } from "~/lib/prisma.js";
import type { PublishThemeInput } from "~/validations/tema.js";

const THEMES_BY_PERSON = 50;

type ThemeWithAuthor = {
  id: string;
  name: string;
  description: string | null;
  author: string | null;
  version: string | null;
  tags: string[];
  css: string;
  overrides: unknown;
  actives: unknown;
  bytes: number;
  createdAt: Date;
  user: { id: string; displayName: string; avatarUrl: string | null };
};

function serialize(theme: ThemeWithAuthor): ThemeShared {
  return {
    id: theme.id,
    name: theme.name,
    description: theme.description,
    author: theme.author,
    version: theme.version,
    tags: theme.tags,
    css: theme.css,
    overrides: (theme.overrides ?? {}) as Record<string, string>,
    actives: readActive(theme.actives),
    publishedBy: theme.user,
    createdAt: theme.createdAt.toISOString(),
  };
}

/*
  O que está no banco é Json, e Json aceita qualquer coisa. Antes de entregar
  para quem vai instalar, só passa o que tem nome e URL de texto.
*/
function readActive(value: unknown): ThemeActive[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const { name, url, kind, bytes } = item as Record<string, unknown>;
    if (typeof name !== "string" || typeof url !== "string") return [];

    return [
      {
        name,
        url,
        ...(typeof kind === "string" ? { kind } : {}),
        ...(typeof bytes === "number" ? { bytes } : {}),
      },
    ];
  });
}

function forGallery(theme: Omit<ThemeWithAuthor, "css">): GalleryTheme {
  return {
    id: theme.id,
    name: theme.name,
    description: theme.description,
    author: theme.author,
    version: theme.version,
    tags: theme.tags,
    overrides: (theme.overrides ?? {}) as Record<string, string>,
    actives: readActive(theme.actives),
    weightBytes: theme.bytes,
    publishedBy: theme.user,
    createdAt: theme.createdAt.toISOString(),
  };
}

const AUTHOR = { select: { id: true, displayName: true, avatarUrl: true } };

const WITHOUT_CSS = {
  id: true,
  name: true,
  description: true,
  author: true,
  version: true,
  tags: true,
  overrides: true,
  actives: true,
  bytes: true,
  createdAt: true,
  user: AUTHOR,
} as const;

export const themeService = {
  async publish(userId: string, entry: PublishThemeInput): Promise<ThemeShared> {
    const hasNothing = !entry.css.trim() && Object.keys(entry.overrides).length === 0;
    if (hasNothing) throw new AppError("Não há nada no tema para compartilhar", 400);

    const count = await prisma.theme.count({ where: { authorId: userId } });
    if (count >= THEMES_BY_PERSON) {
      throw new AppError(
        `Você já publicou ${THEMES_BY_PERSON} temas. Apague um antes de publicar outro.`,
        409,
      );
    }

    const header = readThemeHeader(entry.css);

    const theme = await prisma.theme.create({
      data: {
        name: entry.name ?? header.name ?? "Tema sem nome",
        description: header.description,
        author: header.author,
        version: header.version,
        tags: header.tags,
        css: entry.css,
        overrides: entry.overrides,
        actives: entry.actives,
        bytes: themeWeight(entry.css, entry.actives),
        authorId: userId,
      },
      include: { user: AUTHOR },
    });

    void officialService.notify(userId, "themePublished", { name: theme.name, themeId: theme.id });

    return serialize(theme);
  },

  async search(themeId: string): Promise<ThemeShared> {
    const theme = await prisma.theme.findUnique({
      where: { id: themeId },
      include: { user: AUTHOR },
    });

    if (!theme) throw new NotFoundError("Tema não encontrado");

    return serialize(theme);
  },

  async gallery(search?: string): Promise<GalleryTheme[]> {
    const term = search?.trim();

    const themes = await prisma.theme.findMany({
      where: term
        ? {
            OR: [
              { name: { contains: term, mode: "insensitive" } },
              { description: { contains: term, mode: "insensitive" } },
              { tags: { has: term.toLowerCase() } },
            ],
          }
        : {},
      select: WITHOUT_CSS,
      orderBy: { createdAt: "desc" },
      take: 60,
    });

    return themes.map(forGallery);
  },

  async mine(userId: string): Promise<ThemeShared[]> {
    const themes = await prisma.theme.findMany({
      where: { authorId: userId },
      include: { user: AUTHOR },
      orderBy: { createdAt: "desc" },
    });

    return themes.map(serialize);
  },

  async doDelete(userId: string, themeId: string) {
    const theme = await prisma.theme.findUnique({ where: { id: themeId } });

    if (!theme) throw new NotFoundError("Tema não encontrado");
    if (theme.authorId !== userId) throw new AppError("Esse tema não é seu", 403);

    await prisma.theme.delete({ where: { id: themeId } });
  },
};
