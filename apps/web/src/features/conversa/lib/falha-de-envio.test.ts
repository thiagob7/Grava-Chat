import { describe, expect, it } from "vitest";

import { failureKey, failureReason, newCanTry } from "./falha-de-envio";

describe("motivo da falha", () => {
  it("lê o motivo que o servidor pendurou no erro", () => {
    expect(failureReason(Object.assign(new Error("de castigo"), { reason: "castigo" }))).toBe("castigo");
  });

  it("não confia em motivo que não conhece", () => {
    expect(failureReason(Object.assign(new Error("x"), { reason: "inventado" }))).toBe("erro");
  });

  it("erro sem motivo nenhum é erro genérico", () => {
    expect(failureReason(new Error("caiu"))).toBe("erro");
    expect(failureReason(null)).toBe("erro");
  });
});

describe("texto do aviso", () => {
  it("tem uma chave para cada motivo", () => {
    const reasons = ["sem-conexao", "sem-acesso", "sem-permissao", "castigo", "modo-lento", "depressa", "automod", "recusada", "erro"] as const;

    const keys = reasons.map((m) => failureKey(m));

    expect(new Set(keys).size).toBe(reasons.length);
    expect(keys.every((c) => c.split(".").length === 3)).toBe(true);
  });

  it("cai no genérico quando não veio motivo", () => {
    expect(failureKey(undefined)).toBe("conversa.falha.erro");
  });
});

describe("oferecer tentar de novo", () => {
  it("oferece onde esperar resolve", () => {
    for (const reason of ["sem-conexao", "modo-lento", "depressa", "erro"] as const) {
      expect({ reason, offers: newCanTry(reason) }).toEqual({ reason, offers: true });
    }
  });

  it("não oferece onde insistir bate na mesma parede", () => {
    for (const reason of ["sem-acesso", "sem-permissao", "castigo", "automod", "recusada"] as const) {
      expect({ reason, offers: newCanTry(reason) }).toEqual({ reason, offers: false });
    }
  });

  it("sem motivo, deixa tentar", () => {
    expect(newCanTry(undefined)).toBe(true);
  });
});
