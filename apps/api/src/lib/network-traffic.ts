import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

export interface MonthlyTraffic {
  month: string;
  sent: number;
  received: number;
  since: string | null;
}

type VnstatDate = { year?: number; month?: number; day?: number };
type VnstatInterface = {
  name?: string;
  created?: { date?: VnstatDate };
  traffic?: { total?: { rx?: number; tx?: number }; month?: { date?: VnstatDate; rx?: number; tx?: number }[] };
};

const pad = (n: number) => String(n).padStart(2, "0");

export function readVnstatMonth(json: unknown, now = new Date()): MonthlyTraffic | null {
  const interfaces = ((json as { interfaces?: VnstatInterface[] })?.interfaces ?? []).filter((i) => i.name !== "lo");
  if (!interfaces.length) return null;

  const main = interfaces.reduce((a, b) => ((b.traffic?.total?.tx ?? 0) > (a.traffic?.total?.tx ?? 0) ? b : a));
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const current = main.traffic?.month?.find((m) => m.date?.year === year && m.date?.month === month);
  const created = main.created?.date;

  return {
    month: `${year}-${pad(month)}`,
    sent: current?.tx ?? 0,
    received: current?.rx ?? 0,
    since: created?.year && created.month && created.day ? `${created.year}-${pad(created.month)}-${pad(created.day)}` : null,
  };
}

export async function monthlyTraffic(): Promise<MonthlyTraffic | null> {
  try {
    const { stdout } = await run("vnstat", ["--json", "m"], { timeout: 2_000 });
    return readVnstatMonth(JSON.parse(stdout));
  } catch {
    return null;
  }
}
