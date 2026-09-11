import { describe, expect, it } from "vitest";

import { describeFont } from "./fonte-da-tela";

const track = (label: string, displaySurface?: string) => ({
  label,
  getSettings: () => ({ displaySurface }),
});

describe("descreverFonte", () => {
  it("o nome vindo do seletor do desktop vence tudo", () => {
    const fromDesktop = { name: "Visual Studio Code", icon: "data:image/png;base64,x" };

    expect(describeFont(fromDesktop, track("screen:0:0"))).toEqual(fromDesktop);
  });

  it("rótulo que é um nome de verdade é usado", () => {
    expect(describeFont(null, track("Counter-Strike 2"))?.name).toBe("Counter-Strike 2");
  });

  it("aba do Chrome: o identificador vira o tipo, não um genérico", () => {
    const font = describeFont(null, track("web-contents-media-stream://5/1", "browser"));

    expect(font?.name).toBe("Uma aba do navegador");
  });

  it("janela e monitor também são descritos pelo tipo", () => {
    expect(describeFont(null, track("window:12345:0", "window"))?.name).toBe("Uma janela");
    expect(describeFont(null, track("screen:0:0", "monitor"))?.name).toBe("A tela inteira");
  });

  it("sem rótulo e sem tipo, o genérico ainda é a última saída", () => {
    expect(describeFont(null, track(""))?.name).toBe("Sua tela");
  });

  it("sem faixa nenhuma não quebra", () => {
    expect(describeFont(null, null)?.name).toBe("Sua tela");
    expect(describeFont(null, undefined)?.name).toBe("Sua tela");
  });

  it("navegador antigo sem getSettings não quebra", () => {
    expect(describeFont(null, { label: "screen:0:0" })?.name).toBe("Sua tela");
  });

  it("o rótulo tem precedência sobre o tipo quando é um nome", () => {
    expect(describeFont(null, track("YouTube", "browser"))?.name).toBe("YouTube");
  });
});
