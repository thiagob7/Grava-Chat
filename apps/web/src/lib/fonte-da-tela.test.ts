import { describe, expect, it } from "vitest";

import { descreverFonte } from "./fonte-da-tela";

const faixa = (label: string, displaySurface?: string) => ({
  label,
  getSettings: () => ({ displaySurface }),
});

describe("descreverFonte", () => {
  it("o nome vindo do seletor do desktop vence tudo", () => {
    const doDesktop = { nome: "Visual Studio Code", icone: "data:image/png;base64,x" };

    expect(descreverFonte(doDesktop, faixa("screen:0:0"))).toEqual(doDesktop);
  });

  it("rótulo que é um nome de verdade é usado", () => {
    expect(descreverFonte(null, faixa("Counter-Strike 2"))?.nome).toBe("Counter-Strike 2");
  });

  it("aba do Chrome: o identificador vira o tipo, não um genérico", () => {
    const fonte = descreverFonte(null, faixa("web-contents-media-stream://5/1", "browser"));

    expect(fonte?.nome).toBe("Uma aba do navegador");
  });

  it("janela e monitor também são descritos pelo tipo", () => {
    expect(descreverFonte(null, faixa("window:12345:0", "window"))?.nome).toBe("Uma janela");
    expect(descreverFonte(null, faixa("screen:0:0", "monitor"))?.nome).toBe("A tela inteira");
  });

  it("sem rótulo e sem tipo, o genérico ainda é a última saída", () => {
    expect(descreverFonte(null, faixa(""))?.nome).toBe("Sua tela");
  });

  it("sem faixa nenhuma não quebra", () => {
    expect(descreverFonte(null, null)?.nome).toBe("Sua tela");
    expect(descreverFonte(null, undefined)?.nome).toBe("Sua tela");
  });

  it("navegador antigo sem getSettings não quebra", () => {
    expect(descreverFonte(null, { label: "screen:0:0" })?.nome).toBe("Sua tela");
  });

  it("o rótulo tem precedência sobre o tipo quando é um nome", () => {
    expect(descreverFonte(null, faixa("YouTube", "browser"))?.nome).toBe("YouTube");
  });
});
