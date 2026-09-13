import { describe, expect, it, vi } from "vitest";

const mget = vi.fn();
const del = vi.fn();
const idsWithoutDesired = vi.fn();
const setDesiredMany = vi.fn();

vi.mock("~/lib/redis.js", () => ({
  redis: { mget: (...a: unknown[]) => mget(...a), del: (...a: unknown[]) => del(...a) },
  keys: { sessions: () => "", idle: () => "", legacyPresence: (id: string) => `presence:${id}` },
}));

vi.mock("~/repositories/user-repository.js", () => ({
  userRepository: {
    idsWithoutDesired: (...a: unknown[]) => idsWithoutDesired(...a),
    setDesiredMany: (...a: unknown[]) => setDesiredMany(...a),
  },
}));

const { visible, presenceService } = await import("~/services/presence-service.js");

describe("migração do status escolhido", () => {
  it("quem estava invisível continua invisível depois do deploy", async () => {
    idsWithoutDesired.mockResolvedValue(["a", "b", "c"]);
    mget.mockResolvedValue(["INVISIBLE", null, "lixo"]);

    await expect(presenceService.migrateDesired()).resolves.toBe(3);

    expect(setDesiredMany).toHaveBeenCalledWith(["a"], "INVISIBLE");
    expect(setDesiredMany).toHaveBeenCalledWith(["b", "c"], "ONLINE");
    expect(del).toHaveBeenCalledWith("presence:a", "presence:b", "presence:c");
  });

  it("na segunda subida não há o que migrar", async () => {
    vi.clearAllMocks();
    idsWithoutDesired.mockResolvedValue([]);

    await expect(presenceService.migrateDesired()).resolves.toBe(0);
    expect(mget).not.toHaveBeenCalled();
  });
});

describe("projecao de presenca", () => {
  it("quem nao esta conectado esta offline, escolha o que escolher", () => {
    expect(visible("ONLINE", false, false)).toBe("OFFLINE");
    expect(visible("DND", false, false)).toBe("OFFLINE");
  });

  it("invisivel aparece OFFLINE pros outros", () => {
    expect(visible("INVISIBLE", true, false)).toBe("OFFLINE");
  });

  it("nao perturbe GANHA do ausente automatico", () => {
    expect(visible("DND", true, true)).toBe("DND");
  });

  it("parado vira ausente quando nao ha escolha em contrario", () => {
    expect(visible("ONLINE", true, true)).toBe("IDLE");
    expect(visible(null, true, true)).toBe("IDLE");
  });

  it("sem escolha nenhuma, conectado e disponivel", () => {
    expect(visible(null, true, false)).toBe("ONLINE");
  });

  it("ausente escolhido na mao continua ausente sem ociosidade", () => {
    expect(visible("IDLE", true, false)).toBe("IDLE");
  });
});
