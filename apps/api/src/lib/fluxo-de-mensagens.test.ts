import { describe, expect, it } from "vitest";

import { flowPassed, flowMessage, LIMIT_BY_WINDOW, WINDOW_S } from "./fluxo-de-mensagens.js";

describe("passouDoFluxo", () => {
  it("a primeira mensagem da janela passa", () => {
    expect(flowPassed(1)).toBe(false);
  });

  it("a mensagem que fecha o limite ainda passa", () => {
    expect(flowPassed(LIMIT_BY_WINDOW)).toBe(false);
  });

  it("a seguinte é barrada", () => {
    expect(flowPassed(LIMIT_BY_WINDOW + 1)).toBe(true);
  });

  it("o teto fica bem acima de quem digita e bem abaixo de uma rajada", () => {
    expect(flowPassed(5)).toBe(false);
    expect(flowPassed(200)).toBe(true);
  });

  it("a janela é curta o bastante pra destravar sozinha", () => {
    expect(WINDOW_S).toBeLessThanOrEqual(30);
  });
});

describe("mensagemDeFluxo", () => {
  it("diz quantos segundos faltam", () => {
    expect(flowMessage(7)).toContain("7s");
  });

  it("nunca manda esperar zero — o TTL do Redis pode voltar 0 ou -1", () => {
    expect(flowMessage(0)).toContain("1s");
    expect(flowMessage(-1)).toContain("1s");
  });
});
