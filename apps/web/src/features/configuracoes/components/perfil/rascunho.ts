import type {
  Decoration,
  NameEffect,
  ProfileEffect,
  ProfileStyle,
  NameFont,
  Frame,
  Rank,
  Plate,
} from "@gravae/shared";

import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { EMPTY } from "~/features/perfil/lib/catalogo";

export interface ProfileDraft {
  displayName: string;
  tag: string;
  tagGuildId: string | null;
  bio: string;
  pronouns: string;
  avatarUrl: string | null;

  font: NameFont;
  nameEffect: NameEffect;
  color: string | null;
  color2: string | null;

  rank: Rank;
  decoration: Decoration;
  frame: Frame;
  profileEffect: ProfileEffect;
  plate: Plate;

  bannerUrl: string | null;
  bannerColor: string | null;
  themePrimary: string | null;
  secondaryTheme: string | null;
}

export function fromUser(user: SelfUserModel): ProfileDraft {
  const p = user.profile;

  return {
    displayName: user.displayName,
    tag: p?.tag ?? "",
    tagGuildId: p?.tagGuildId ?? null,
    bio: user.bio ?? "",
    pronouns: user.pronouns ?? "",
    avatarUrl: user.avatarUrl,

    font: p?.name?.font ?? "padrao",
    nameEffect: p?.name?.effect ?? "solido",
    color: p?.name?.color ?? null,
    color2: p?.name?.color2 ?? null,

    rank: p?.rank ?? "nenhuma",
    decoration: p?.decoration ?? "nenhuma",
    frame: p?.frame ?? "nenhuma",
    profileEffect: p?.effect ?? "nenhum",
    plate: p?.plate ?? "nenhuma",

    bannerUrl: p?.bannerUrl ?? null,
    bannerColor: p?.bannerColor ?? null,
    themePrimary: p?.themePrimary ?? null,
    secondaryTheme: p?.secondaryTheme ?? null,
  };
}

export function forProfile(r: ProfileDraft): ProfileStyle | null {
  const name = emptyWithout({
    font: r.font,
    effect: r.nameEffect,
    color: r.color,
    color2: r.color2,
  });

  const profile = emptyWithout({
    ...(Object.keys(name).length ? { name } : {}),
    tag: r.tag.trim(),
    tagGuildId: r.tagGuildId,
    rank: r.rank,
    decoration: r.decoration,
    frame: r.frame,
    effect: r.profileEffect,
    plate: r.plate,
    bannerUrl: r.bannerUrl,
    bannerColor: r.bannerColor,
    themePrimary: r.themePrimary,
    secondaryTheme: r.secondaryTheme,
  });

  return Object.keys(profile).length ? (profile as ProfileStyle) : null;
}

function emptyWithout<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined || value === "") continue;
    if (typeof value === "string" && EMPTY.has(value)) continue;

    output[key] = value;
  }

  return output as Partial<T>;
}
