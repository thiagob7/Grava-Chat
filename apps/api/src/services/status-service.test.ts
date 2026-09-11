import { beforeEach, describe, expect, it, vi } from "vitest";

const records = vi.fn();
const ping = vi.fn();
const pingRedis = vi.fn();
const sfuState = vi.fn();

vi.mock("~/lib/prisma.js", () => ({
  prisma: {
    dayStatus: {
      findMany: (...a: unknown[]) => records(...a),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    $runCommandRaw: (...a: unknown[]) => ping(...a),
  },
}));

vi.mock("~/lib/redis.js", () => ({ redis: { ping: () => pingRedis() } }));

vi.mock("~/services/voice-service.js", () => ({
  voiceService: { sfuState: () => sfuState() },
}));

const { DAYS_STORED, dayUtc, statusService } = await import("~/services/status-service.js");

const dayBack = (n: number) => dayUtc(new Date(Date.now() - n * 24 * 60 * 60 * 1000));

beforeEach(() => {
  vi.clearAllMocks();
  records.mockResolvedValue([]);
  ping.mockResolvedValue({ ok: 1 });
  pingRedis.mockResolvedValue("PONG");
  sfuState.mockResolvedValue({ rooms: 0 });
});

describe("o dia do balde", () => {
  it("é a data em UTC, sem hora", () => {
    expect(dayUtc(new Date("2026-09-03T23:40:00Z"))).toBe("2026-09-03");
  });

  it("não escorrega para o dia anterior por causa do fuso", () => {
    expect(dayUtc(new Date("2026-09-04T02:00:00Z"))).toBe("2026-09-04");
  });
});

describe("o estado de agora", () => {
  it("lista as quatro peças, com a API sempre no ar", async () => {
    const measures = await statusService.stateNow();

    expect(measures.map((m) => m.piece)).toEqual(["api", "banco", "cache", "sfu"]);
    expect(measures.every((m) => m.state === "up")).toBe(true);
  });

  it("marca como fora quem levanta erro", async () => {
    pingRedis.mockRejectedValue(new Error("sem conexão"));

    const measures = await statusService.stateNow();

    expect(measures.find((m) => m.piece === "cache")?.state).toBe("down");
    expect(measures.find((m) => m.piece === "banco")?.state).toBe("up");
  });

  it("marca o SFU como fora quando ele responde vazio", async () => {
    sfuState.mockResolvedValue(null);

    const measures = await statusService.stateNow();

    expect(measures.find((m) => m.piece === "sfu")?.state).toBe("down");
  });
});

describe("a janela de dias", () => {
  it("devolve a janela inteira, mesmo sem registro nenhum", async () => {
    const appWindow = await statusService.appWindow();

    expect(appWindow.api).toHaveLength(DAYS_STORED);
    expect(appWindow.api.every((d) => d.uptime === null)).toBe(true);
    expect(appWindow.api.at(-1)?.day).toBe(dayBack(0));
  });

  it("distingue dia sem medição de dia sem nenhuma resposta", async () => {
    records.mockResolvedValue([
      { piece: "api", day: dayBack(1), measures: 100, failures: 100, msSoma: 0 },
    ]);

    const appWindow = await statusService.appWindow();
    const yesterday = appWindow.api.find((d) => d.day === dayBack(1));

    expect(yesterday?.uptime).toBe(0);
    expect(appWindow.api.find((d) => d.day === dayBack(2))?.uptime).toBeNull();
  });

  it("conta a porcentagem com duas casas", async () => {
    records.mockResolvedValue([
      { piece: "banco", day: dayBack(3), measures: 1440, failures: 1, msSoma: 0 },
    ]);

    const appWindow = await statusService.appWindow();

    expect(appWindow.banco.find((d) => d.day === dayBack(3))?.uptime).toBe(99.93);
  });

  it("trata registro sem medição como buraco", async () => {
    records.mockResolvedValue([
      { piece: "cache", day: dayBack(5), measures: 0, failures: 0, msSoma: 0 },
    ]);

    const appWindow = await statusService.appWindow();

    expect(appWindow.cache.find((d) => d.day === dayBack(5))?.uptime).toBeNull();
  });
});
