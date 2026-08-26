import type { Decoracao } from "@gravae/shared";

interface Animada {
  arquivo: () => Promise<{ default: unknown }>;
  folga: string;
  segmento?: [number, number];
}

const ARQUIVOS: Partial<Record<Decoracao, Animada>> = {
  aro: { arquivo: () => import("~/assets/decoracoes/aro.json"), folga: "-16%" },
  alada: {
    arquivo: () => import("~/assets/decoracoes/alada.json"),
    folga: "-24%",
  },
};

export const ehAnimada = (decoracao: Decoracao | null | undefined): boolean =>
  Boolean(decoracao && decoracao in ARQUIVOS);

export async function carregarDecoracao(
  decoracao: Decoracao,
): Promise<unknown | null> {
  const animada = ARQUIVOS[decoracao];
  if (!animada) return null;

  return (await animada.arquivo()).default;
}

export const folgaDaDecoracao = (decoracao: Decoracao): string =>
  ARQUIVOS[decoracao]?.folga ?? "-16%";

export const segmentoDaDecoracao = (
  decoracao: Decoracao,
): [number, number] | undefined => ARQUIVOS[decoracao]?.segmento;
