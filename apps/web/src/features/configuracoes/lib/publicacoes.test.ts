import { describe, expect, it } from "vitest";

import { delay, writeSince, readSituation } from "./publicacoes";

describe("há quanto tempo está de pé", () => {
  it("escreve na maior unidade que couber", () => {
    expect(writeSince(90)).toBe("1min");
    expect(writeSince(3600)).toBe("1h");
    expect(writeSince(86_400 * 3)).toBe("3d");
  });

  it("nunca escreve zero minuto para quem acabou de subir", () => {
    expect(writeSince(5)).toBe("1min");
  });

  it("sem informação, não inventa", () => {
    expect(writeSince(null)).toBe("—");
  });
});

describe("comparar o que roda com o que está no git", () => {
  it("o curto do build casa com o longo do git", () => {
    expect(delay("b47835b", "b47835bd9f1e2a3c4d5e6f")).toBe("igual");
  });

  it("commit diferente é atraso", () => {
    expect(delay("b47835b", "39fe317aaaaaaa")).toBe("atras");
  });

  it("sem um dos lados, não afirma nada", () => {
    expect(delay(null, "39fe317")).toBe("desconhecido");
    expect(delay("b47835b", null)).toBe("desconhecido");
  });
});

describe("situação da publicação", () => {
  it("o que ainda não terminou", () => {
    expect(readSituation("waiting", null)).toBe("esperando");
    expect(readSituation("queued", null)).toBe("rodando");
    expect(readSituation("in_progress", null)).toBe("rodando");
  });

  it("status que a gente não conhece conta como rodando, não como erro", () => {
    expect(readSituation("inventado", null)).toBe("rodando");
  });

  it("o que terminou", () => {
    expect(readSituation("completed", "success")).toBe("boa");
    expect(readSituation("completed", "failure")).toBe("falhou");
    expect(readSituation("completed", "cancelled")).toBe("cancelada");
  });

  it("terminou sem conclusão nenhuma é falha, não sucesso", () => {
    expect(readSituation("completed", null)).toBe("falhou");
  });
});
