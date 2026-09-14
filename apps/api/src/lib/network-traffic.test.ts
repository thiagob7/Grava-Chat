import { describe, expect, it } from "vitest";

import { readVnstatMonth } from "~/lib/network-traffic.js";

const now = new Date("2026-09-20T12:00:00Z");

describe("tráfego do mês pelo vnStat", () => {
  it("pega o mês atual da interface principal, ignorando o loopback", () => {
    const json = {
      interfaces: [
        { name: "lo", traffic: { total: { tx: 999 }, month: [{ date: { year: 2026, month: 9 }, rx: 9, tx: 999 }] } },
        {
          name: "ens3",
          created: { date: { year: 2026, month: 9, day: 14 } },
          traffic: {
            total: { tx: 500 },
            month: [
              { date: { year: 2026, month: 8 }, rx: 1, tx: 2 },
              { date: { year: 2026, month: 9 }, rx: 300, tx: 400 },
            ],
          },
        },
      ],
    };

    expect(readVnstatMonth(json, now)).toEqual({ month: "2026-09", sent: 400, received: 300, since: "2026-09-14" });
  });

  it("mês sem dados ainda conta como zero", () => {
    const json = { interfaces: [{ name: "ens3", traffic: { total: { tx: 0 }, month: [] } }] };
    expect(readVnstatMonth(json, now)).toMatchObject({ month: "2026-09", sent: 0, received: 0 });
  });

  it("sem interface nenhuma não inventa número", () => {
    expect(readVnstatMonth({ interfaces: [] }, now)).toBeNull();
  });
});
