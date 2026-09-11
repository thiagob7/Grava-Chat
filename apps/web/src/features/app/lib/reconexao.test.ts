import { describe, expect, it } from "vitest";

import { mustSwapToken, isRefusalByToken } from "./reconexao";

describe("recusa por token", () => {
  it("reconhece o que o servidor manda quando o token venceu", () => {
    expect(isRefusalByToken("Token inválido ou expirado")).toBe(true);
    expect(isRefusalByToken("Sem token")).toBe(true);
    expect(isRefusalByToken("Token de bot inválido")).toBe(true);
  });

  it("nao confunde queda de rede com token vencido", () => {
    expect(isRefusalByToken("xhr poll error")).toBe(false);
    expect(isRefusalByToken("websocket error")).toBe(false);
    expect(isRefusalByToken("timeout")).toBe(false);
  });
});

describe("quando trocar a copia da sessao", () => {
  it("troca na primeira recusa por token", () => {
    expect(mustSwapToken("Token inválido ou expirado", 100_000, 0)).toBe(true);
  });

  it("nao troca por queda de rede, por mais antiga que seja a ultima", () => {
    expect(mustSwapToken("websocket error", 100_000, 0)).toBe(false);
  });

  it("segura a segunda troca dentro da espera", () => {
    expect(mustSwapToken("Sem token", 10_000, 5_000)).toBe(false);
  });

  it("libera de novo passada a espera", () => {
    expect(mustSwapToken("Sem token", 21_000, 5_000)).toBe(true);
  });

  it("libera exatamente no limite", () => {
    expect(mustSwapToken("Sem token", 20_000, 5_000)).toBe(true);
  });
});
