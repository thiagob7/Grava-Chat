import type { Patente } from "@gravae/shared";

interface Arte {
  arquivo: () => Promise<{ default: unknown }>;
  proporcao: number;
}

const ARQUIVOS: Partial<Record<Patente, Arte>> = {
  orbe: {
    arquivo: () => import("~/assets/patentes/orbe.json"),
    proporcao: 953 / 526,
  },
};

export const ehPatenteComArte = (patente: Patente | null | undefined): boolean =>
  !!patente && patente in ARQUIVOS;

export async function carregarPatente(patente: Patente): Promise<unknown | null> {
  const arte = ARQUIVOS[patente];
  if (!arte) return null;

  return (await arte.arquivo()).default;
}

export const proporcaoDaPatente = (patente: Patente): number =>
  ARQUIVOS[patente]?.proporcao ?? 1;
