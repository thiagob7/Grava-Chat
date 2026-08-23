import { describe, expect, it, vi } from "vitest";

/**
 * `visible()` e uma funcao pura, mas mora no service — e o service abre Redis
 * no import. O mock existe so pra isso: o teste e da REGRA, nao da conexao.
 */
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
    // e o unico jeito: `INVISIBLE` nao existe no enum publico de presenca
    expect(visible("INVISIBLE", true, false)).toBe("OFFLINE");
  });

  it("nao perturbe GANHA do ausente automatico", () => {
    // quem pediu silencio nao volta a "ausente" so por ter parado de mexer
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
