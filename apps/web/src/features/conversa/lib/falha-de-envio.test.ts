import { describe, expect, it } from "vitest";

import { chaveDaFalha, motivoDaFalha, podeTentarDeNovo } from "./falha-de-envio";

describe("motivo da falha", () => {
  it("lê o motivo que o servidor pendurou no erro", () => {
    expect(motivoDaFalha(Object.assign(new Error("de castigo"), { motivo: "castigo" }))).toBe("castigo");
  });

  it("não confia em motivo que não conhece", () => {
    expect(motivoDaFalha(Object.assign(new Error("x"), { motivo: "inventado" }))).toBe("erro");
  });

  it("erro sem motivo nenhum é erro genérico", () => {
    expect(motivoDaFalha(new Error("caiu"))).toBe("erro");
    expect(motivoDaFalha(null)).toBe("erro");
  });
});

describe("texto do aviso", () => {
  it("tem uma chave para cada motivo", () => {
    const motivos = ["sem-conexao", "sem-acesso", "sem-permissao", "castigo", "modo-lento", "depressa", "automod", "recusada", "erro"] as const;

    const chaves = motivos.map((m) => chaveDaFalha(m));

    expect(new Set(chaves).size).toBe(motivos.length);
    expect(chaves.every((c) => c.split(".").length === 3)).toBe(true);
  });

  it("cai no genérico quando não veio motivo", () => {
    expect(chaveDaFalha(undefined)).toBe("conversa.falha.erro");
  });
});

describe("oferecer tentar de novo", () => {
  it("oferece onde esperar resolve", () => {
    for (const motivo of ["sem-conexao", "modo-lento", "depressa", "erro"] as const) {
      expect({ motivo, oferece: podeTentarDeNovo(motivo) }).toEqual({ motivo, oferece: true });
    }
  });

  it("não oferece onde insistir bate na mesma parede", () => {
    for (const motivo of ["sem-acesso", "sem-permissao", "castigo", "automod", "recusada"] as const) {
      expect({ motivo, oferece: podeTentarDeNovo(motivo) }).toEqual({ motivo, oferece: false });
    }
  });

  it("sem motivo, deixa tentar", () => {
    expect(podeTentarDeNovo(undefined)).toBe(true);
  });
});
