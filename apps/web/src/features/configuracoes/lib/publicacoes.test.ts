import { describe, expect, it } from "vitest";

import { atraso, escreverDesde, lerSituacao } from "./publicacoes";

describe("há quanto tempo está de pé", () => {
  it("escreve na maior unidade que couber", () => {
    expect(escreverDesde(90)).toBe("1min");
    expect(escreverDesde(3600)).toBe("1h");
    expect(escreverDesde(86_400 * 3)).toBe("3d");
  });

  it("nunca escreve zero minuto para quem acabou de subir", () => {
    expect(escreverDesde(5)).toBe("1min");
  });

  it("sem informação, não inventa", () => {
    expect(escreverDesde(null)).toBe("—");
  });
});

describe("comparar o que roda com o que está no git", () => {
  it("o curto do build casa com o longo do git", () => {
    expect(atraso("b47835b", "b47835bd9f1e2a3c4d5e6f")).toBe("igual");
  });

  it("commit diferente é atraso", () => {
    expect(atraso("b47835b", "39fe317aaaaaaa")).toBe("atras");
  });

  it("sem um dos lados, não afirma nada", () => {
    expect(atraso(null, "39fe317")).toBe("desconhecido");
    expect(atraso("b47835b", null)).toBe("desconhecido");
  });
});

describe("situação da publicação", () => {
  it("o que ainda não terminou", () => {
    expect(lerSituacao("waiting", null)).toBe("esperando");
    expect(lerSituacao("queued", null)).toBe("rodando");
    expect(lerSituacao("in_progress", null)).toBe("rodando");
  });

  it("status que a gente não conhece conta como rodando, não como erro", () => {
    expect(lerSituacao("inventado", null)).toBe("rodando");
  });

  it("o que terminou", () => {
    expect(lerSituacao("completed", "success")).toBe("boa");
    expect(lerSituacao("completed", "failure")).toBe("falhou");
    expect(lerSituacao("completed", "cancelled")).toBe("cancelada");
  });

  it("terminou sem conclusão nenhuma é falha, não sucesso", () => {
    expect(lerSituacao("completed", null)).toBe("falhou");
  });
});
