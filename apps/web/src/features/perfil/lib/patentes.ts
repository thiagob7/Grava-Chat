import type { Rank } from "@gravae/shared";

interface Art {
  file: () => Promise<{ default: unknown }>;
  ratio: number;
}

const FILES: Partial<Record<Rank, Art>> = {
  orbe: {
    file: () => import("~/assets/patentes/orbe.json"),
    ratio: 953 / 526,
  },
};

export const isRankWithArt = (rank: Rank | null | undefined): boolean =>
  !!rank && rank in FILES;

export async function loadRank(rank: Rank): Promise<unknown | null> {
  const art = FILES[rank];
  if (!art) return null;

  return (await art.file()).default;
}

export const rankRatio = (rank: Rank): number =>
  FILES[rank]?.ratio ?? 1;
