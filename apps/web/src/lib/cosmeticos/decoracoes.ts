import type { Decoracao } from "@gravae/shared";

import coroaUrl from "~/assets/decoracoes/coroa.svg?url";
import runasUrl from "~/assets/decoracoes/runas.svg?url";
import loureiroUrl from "~/assets/decoracoes/loureiro.svg?url";

interface Lottie {
  arquivo: () => Promise<{ default: unknown }>;
  folga: string;
  segmento?: [number, number];
}

interface Imagem {
  url: string;
  folga: string;
}

const LOTTIES: Partial<Record<Decoracao, Lottie>> = {
  aro: { arquivo: () => import("~/assets/decoracoes/aro.json"), folga: "-16%" },
  alada: {
    arquivo: () => import("~/assets/decoracoes/alada.json"),
    folga: "-24%",
  },
  gelo: { arquivo: () => import("~/assets/decoracoes/gelo.json"), folga: "-16%" },
};

const IMAGENS: Partial<Record<Decoracao, Imagem>> = {
  coroa: { url: coroaUrl, folga: "-16%" },
  runas: { url: runasUrl, folga: "-16%" },
  loureiro: { url: loureiroUrl, folga: "-22%" },
};

export const ehLottie = (decoracao: Decoracao | null | undefined): boolean =>
  Boolean(decoracao && decoracao in LOTTIES);

export const ehImagem = (decoracao: Decoracao | null | undefined): boolean =>
  Boolean(decoracao && decoracao in IMAGENS);

export const ehDeArquivo = (decoracao: Decoracao | null | undefined): boolean =>
  ehLottie(decoracao) || ehImagem(decoracao);

export async function carregarDecoracao(
  decoracao: Decoracao,
): Promise<unknown | null> {
  const lottie = LOTTIES[decoracao];
  if (!lottie) return null;

  return (await lottie.arquivo()).default;
}

export const imagemDaDecoracao = (decoracao: Decoracao): string | null =>
  IMAGENS[decoracao]?.url ?? null;

export const folgaDaDecoracao = (decoracao: Decoracao): string =>
  LOTTIES[decoracao]?.folga ?? IMAGENS[decoracao]?.folga ?? "-16%";

export const segmentoDaDecoracao = (
  decoracao: Decoracao,
): [number, number] | undefined => LOTTIES[decoracao]?.segmento;
