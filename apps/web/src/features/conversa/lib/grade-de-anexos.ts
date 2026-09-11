import type { Places } from "~/lib/compat-de-tema";

export interface AttachmentsArrangement {
  outside?: Places;
  grid: Places;
  columns: number;
  inUp?: number;
}

const ARRANGEMENTS: Record<number, AttachmentsArrangement> = {
  2: { grid: "twoGrid", columns: 2 },
  3: { grid: "threeGrid", columns: 3 },
  4: { grid: "fourGrid", columns: 2 },
  5: { grid: "fiveGrid", columns: 6 },
  6: { grid: "sixGrid", columns: 3 },
  7: { outside: "sevenBox", grid: "sevenGrid", columns: 3, inUp: 1 },
  8: { outside: "eightBox", grid: "eightGrid", columns: 3, inUp: 2 },
  9: { grid: "nineGrid", columns: 3 },
  10: { outside: "tenBox", grid: "tenGrid", columns: 3, inUp: 1 },
};

export function attachmentsArrangement(count: number): AttachmentsArrangement | null {
  return ARRANGEMENTS[count] ?? null;
}

export function itemColumns(count: number, index: number): number {
  if (count !== 5) return 1;
  return index < 2 ? 3 : 2;
}
