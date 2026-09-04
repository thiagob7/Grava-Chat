import { describe, expect, it } from "vitest";

import { passouDoFluxo, mensagemDeFluxo, LIMITE_POR_JANELA, JANELA_S } from "./fluxo-de-mensagens.js";

describe("passouDoFluxo", () => {
  it("a primeira mensagem da janela passa", () => {
    expect(passouDoFluxo(1)).toBe(false);
  });

  it("a mensagem que fecha o limite ainda passa", () => {
    expect(passouDoFluxo(LIMITE_POR_JANELA)).toBe(false);
  });

  it("a seguinte é barrada", () => {
    expect(passouDoFluxo(LIMITE_POR_JANELA + 1)).toBe(true);
  });

  it("o teto fica bem acima de quem digita e bem abaixo de uma rajada", () => {
    expect(passouDoFluxo(5)).toBe(false);
    expect(passouDoFluxo(200)).toBe(true);
  });

  it("a janela é curta o bastante pra destravar sozinha", () => {
    expect(JANELA_S).toBeLessThanOrEqual(30);
  });
});

describe("mensagemDeFluxo", () => {
  it("diz quantos segundos faltam", () => {
    expect(mensagemDeFluxo(7)).toContain("7s");
  });

  it("nunca manda esperar zero — o TTL do Redis pode voltar 0 ou -1", () => {
    expect(mensagemDeFluxo(0)).toContain("1s");
    expect(mensagemDeFluxo(-1)).toContain("1s");
  });
});
