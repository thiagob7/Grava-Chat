import { describe, expect, it } from "vitest";

import { deveTrocarToken, ehRecusaPorToken } from "./reconexao";

describe("recusa por token", () => {
  it("reconhece o que o servidor manda quando o token venceu", () => {
    expect(ehRecusaPorToken("Token inválido ou expirado")).toBe(true);
    expect(ehRecusaPorToken("Sem token")).toBe(true);
    expect(ehRecusaPorToken("Token de bot inválido")).toBe(true);
  });

  it("nao confunde queda de rede com token vencido", () => {
    expect(ehRecusaPorToken("xhr poll error")).toBe(false);
    expect(ehRecusaPorToken("websocket error")).toBe(false);
    expect(ehRecusaPorToken("timeout")).toBe(false);
  });
});

describe("quando trocar a copia da sessao", () => {
  it("troca na primeira recusa por token", () => {
    expect(deveTrocarToken("Token inválido ou expirado", 100_000, 0)).toBe(true);
  });

  it("nao troca por queda de rede, por mais antiga que seja a ultima", () => {
    expect(deveTrocarToken("websocket error", 100_000, 0)).toBe(false);
  });

  it("segura a segunda troca dentro da espera", () => {
    expect(deveTrocarToken("Sem token", 10_000, 5_000)).toBe(false);
  });

  it("libera de novo passada a espera", () => {
    expect(deveTrocarToken("Sem token", 21_000, 5_000)).toBe(true);
  });

  it("libera exatamente no limite", () => {
    expect(deveTrocarToken("Sem token", 20_000, 5_000)).toBe(true);
  });
});
