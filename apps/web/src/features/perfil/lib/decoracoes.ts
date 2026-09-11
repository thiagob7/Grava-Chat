import type { Decoration } from "@gravae/shared";

import coroaUrl from "~/assets/decoracoes/coroa.svg?url";
import runesUrl from "~/assets/decoracoes/runas.svg?url";
import laurelUrl from "~/assets/decoracoes/loureiro.svg?url";

interface Lottie {
  file: () => Promise<{ default: unknown }>;
  slack: string;
  segment?: [number, number];
}

interface Picture {
  url: string;
  slack: string;
}

const LOTTIES: Partial<Record<Decoration, Lottie>> = {
  aro: { file: () => import("~/assets/decoracoes/aro.json"), slack: "-16%" },
  alada: {
    file: () => import("~/assets/decoracoes/alada.json"),
    slack: "-24%",
  },
  gelo: { file: () => import("~/assets/decoracoes/gelo.json"), slack: "-16%" },
};

const IMAGES: Partial<Record<Decoration, Picture>> = {
  coroa: { url: coroaUrl, slack: "-16%" },
  runas: { url: runesUrl, slack: "-16%" },
  loureiro: { url: laurelUrl, slack: "-22%" },
};

export const isLottie = (decoration: Decoration | null | undefined): boolean =>
  Boolean(decoration && decoration in LOTTIES);

export const isImage = (decoration: Decoration | null | undefined): boolean =>
  Boolean(decoration && decoration in IMAGES);

export const isFile = (decoration: Decoration | null | undefined): boolean =>
  isLottie(decoration) || isImage(decoration);

export async function loadDecoration(
  decoration: Decoration,
): Promise<unknown | null> {
  const lottie = LOTTIES[decoration];
  if (!lottie) return null;

  return (await lottie.file()).default;
}

export const decorationImage = (decoration: Decoration): string | null =>
  IMAGES[decoration]?.url ?? null;

export const decorationSlack = (decoration: Decoration): string =>
  LOTTIES[decoration]?.slack ?? IMAGES[decoration]?.slack ?? "-16%";

export const decorationSegment = (
  decoration: Decoration,
): [number, number] | undefined => LOTTIES[decoration]?.segment;
