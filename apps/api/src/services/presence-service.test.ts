import { describe, expect, it, vi } from "vitest";

vi.mock("~/lib/redis.js", () => ({
  redis: {},
  keys: { presence: () => "", sessions: () => "", idle: () => "" },
}));

vi.mock("~/repositories/user-repository.js", () => ({ userRepository: {} }));

const { visible } = await import("~/services/presence-service.js");

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
