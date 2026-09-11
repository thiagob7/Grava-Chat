import { describe, expect, it } from "vitest";

import { activeSubSection } from "./espiao-da-rolagem";

const MY_ACCOUNT = ["detalhes", "dispositivos", "bloqueados", "aplicativos", "sessoes"];

const em = (...tops: number[]) =>
  tops.map((top, i) => ({ id: MY_ACCOUNT[i]!, top }));

describe("qual seção a lateral acende", () => {
  it("acende a última que passou da linha de leitura", () => {
    const active = activeSubSection({
      anchors: em(-400, -120, 300, 560, 730),
      line: 80,
      scrollTotal: 2000,
    });

    expect(active).toBe("dispositivos");
  });

  it("no fim da rolagem, com quatro seções na tela, não pula para a última", () => {
    const active = activeSubSection({
      anchors: em(-400, -120, 300, 560, 730),
      line: 80,
      scrollTotal: 2000,
    });

    expect(active).not.toBe("sessoes");
  });

  it("tela que não rola marca a primeira, não a última", () => {
    const active = activeSubSection({
      anchors: em(0, 120, 240, 360, 480),
      line: 80,
      scrollTotal: 0,
    });

    expect(active).toBe("detalhes");
  });

  it("trata a rolagem que existe só no papel como tela que não rola", () => {
    expect(
      activeSubSection({ anchors: em(0, 120, 240), line: 80, scrollTotal: 6 }),
    ).toBe("detalhes");
  });

  it("no topo, com nada acima da linha, acende a primeira", () => {
    const active = activeSubSection({
      anchors: em(200, 400, 600, 800, 1000),
      line: 80,
      scrollTotal: 900,
    });

    expect(active).toBe("detalhes");
  });

  it("sem seção nenhuma devolve nulo em vez de estourar", () => {
    expect(activeSubSection({ anchors: [], line: 80, scrollTotal: 500 })).toBeNull();
  });

  it("a última seção se marca sozinha quando ela chega à linha", () => {
    const active = activeSubSection({
      anchors: em(-1200, -900, -600, -300, 40),
      line: 80,
      scrollTotal: 2000,
    });

    expect(active).toBe("sessoes");
  });
});
