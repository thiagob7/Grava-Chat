import type { Decoration } from "@gravae/shared";

import coroaUrl from "~/assets/decoracoes/coroa.svg?url";
import runesUrl from "~/assets/decoracoes/runas.svg?url";
import laurelUrl from "~/assets/decoracoes/loureiro.svg?url";
import capybaraUrl from "~/assets/decoracoes/capivara.svg?url";
import catUrl from "~/assets/decoracoes/gato.svg?url";
import toucanUrl from "~/assets/decoracoes/tucano.svg?url";
import frogUrl from "~/assets/decoracoes/sapo.svg?url";
import hummingbirdUrl from "~/assets/decoracoes/beija-flor.svg?url";
import macawUrl from "~/assets/decoracoes/arara.svg?url";
import slothUrl from "~/assets/decoracoes/preguica.svg?url";
import owlUrl from "~/assets/decoracoes/coruja.svg?url";
import butterflyUrl from "~/assets/decoracoes/borboleta.svg?url";
import dogUrl from "~/assets/decoracoes/cachorro.svg?url";

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
  capivara: { url: capybaraUrl, slack: "-24%" },
  gato: { url: catUrl, slack: "-24%" },
  tucano: { url: toucanUrl, slack: "-24%" },
  sapo: { url: frogUrl, slack: "-24%" },
  "beija-flor": { url: hummingbirdUrl, slack: "-24%" },
  arara: { url: macawUrl, slack: "-24%" },
  preguica: { url: slothUrl, slack: "-24%" },
  coruja: { url: owlUrl, slack: "-24%" },
  borboleta: { url: butterflyUrl, slack: "-24%" },
  cachorro: { url: dogUrl, slack: "-24%" },
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
