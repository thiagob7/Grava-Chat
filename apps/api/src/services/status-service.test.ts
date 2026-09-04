import { beforeEach, describe, expect, it, vi } from "vitest";

const registros = vi.fn();
const ping = vi.fn();
const pingRedis = vi.fn();
const estadoDoSfu = vi.fn();

vi.mock("~/lib/prisma.js", () => ({
  prisma: {
    statusDoDia: {
      findMany: (...a: unknown[]) => registros(...a),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    $runCommandRaw: (...a: unknown[]) => ping(...a),
  },
}));

vi.mock("~/lib/redis.js", () => ({ redis: { ping: () => pingRedis() } }));

vi.mock("~/services/voice-service.js", () => ({
  voiceService: { estadoDoSfu: () => estadoDoSfu() },
}));

const { DIAS_GUARDADOS, diaUtc, statusService } = await import("~/services/status-service.js");

const diaAtras = (n: number) => diaUtc(new Date(Date.now() - n * 24 * 60 * 60 * 1000));

beforeEach(() => {
  vi.clearAllMocks();
  registros.mockResolvedValue([]);
  ping.mockResolvedValue({ ok: 1 });
  pingRedis.mockResolvedValue("PONG");
  estadoDoSfu.mockResolvedValue({ salas: 0 });
});

describe("o dia do balde", () => {
  it("é a data em UTC, sem hora", () => {
    expect(diaUtc(new Date("2026-09-03T23:40:00Z"))).toBe("2026-09-03");
  });

  it("não escorrega para o dia anterior por causa do fuso", () => {
    expect(diaUtc(new Date("2026-09-04T02:00:00Z"))).toBe("2026-09-04");
  });
});

describe("o estado de agora", () => {
  it("lista as quatro peças, com a API sempre no ar", async () => {
    const medidas = await statusService.estadoAgora();

    expect(medidas.map((m) => m.peca)).toEqual(["api", "banco", "cache", "sfu"]);
    expect(medidas.every((m) => m.estado === "up")).toBe(true);
  });

  it("marca como fora quem levanta erro", async () => {
    pingRedis.mockRejectedValue(new Error("sem conexão"));

    const medidas = await statusService.estadoAgora();

    expect(medidas.find((m) => m.peca === "cache")?.estado).toBe("down");
    expect(medidas.find((m) => m.peca === "banco")?.estado).toBe("up");
  });

  it("marca o SFU como fora quando ele responde vazio", async () => {
    estadoDoSfu.mockResolvedValue(null);

    const medidas = await statusService.estadoAgora();

    expect(medidas.find((m) => m.peca === "sfu")?.estado).toBe("down");
  });
});

describe("a janela de dias", () => {
  it("devolve a janela inteira, mesmo sem registro nenhum", async () => {
    const janela = await statusService.janela();

    expect(janela.api).toHaveLength(DIAS_GUARDADOS);
    expect(janela.api.every((d) => d.uptime === null)).toBe(true);
    expect(janela.api.at(-1)?.dia).toBe(diaAtras(0));
  });

  it("distingue dia sem medição de dia sem nenhuma resposta", async () => {
    registros.mockResolvedValue([
      { peca: "api", dia: diaAtras(1), medidas: 100, falhas: 100, msSoma: 0 },
    ]);

    const janela = await statusService.janela();
    const ontem = janela.api.find((d) => d.dia === diaAtras(1));

    expect(ontem?.uptime).toBe(0);
    expect(janela.api.find((d) => d.dia === diaAtras(2))?.uptime).toBeNull();
  });

  it("conta a porcentagem com duas casas", async () => {
    registros.mockResolvedValue([
      { peca: "banco", dia: diaAtras(3), medidas: 1440, falhas: 1, msSoma: 0 },
    ]);

    const janela = await statusService.janela();

    expect(janela.banco.find((d) => d.dia === diaAtras(3))?.uptime).toBe(99.93);
  });

  it("trata registro sem medição como buraco", async () => {
    registros.mockResolvedValue([
      { peca: "cache", dia: diaAtras(5), medidas: 0, falhas: 0, msSoma: 0 },
    ]);

    const janela = await statusService.janela();

    expect(janela.cache.find((d) => d.dia === diaAtras(5))?.uptime).toBeNull();
  });
});
