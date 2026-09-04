import { describe, expect, it } from "vitest";

import { subSecaoAtiva } from "./espiao-da-rolagem";

const MINHA_CONTA = ["detalhes", "dispositivos", "bloqueados", "aplicativos", "sessoes"];

const em = (...topos: number[]) =>
  topos.map((topo, i) => ({ id: MINHA_CONTA[i]!, topo }));

describe("qual seção a lateral acende", () => {
  it("acende a última que passou da linha de leitura", () => {
    const ativa = subSecaoAtiva({
      ancoras: em(-400, -120, 300, 560, 730),
      linha: 80,
      rolagemTotal: 2000,
    });

    expect(ativa).toBe("dispositivos");
  });

  it("no fim da rolagem, com quatro seções na tela, não pula para a última", () => {
    const ativa = subSecaoAtiva({
      ancoras: em(-400, -120, 300, 560, 730),
      linha: 80,
      rolagemTotal: 2000,
    });

    expect(ativa).not.toBe("sessoes");
  });

  it("tela que não rola marca a primeira, não a última", () => {
    const ativa = subSecaoAtiva({
      ancoras: em(0, 120, 240, 360, 480),
      linha: 80,
      rolagemTotal: 0,
    });

    expect(ativa).toBe("detalhes");
  });

  it("trata a rolagem que existe só no papel como tela que não rola", () => {
    expect(
      subSecaoAtiva({ ancoras: em(0, 120, 240), linha: 80, rolagemTotal: 6 }),
    ).toBe("detalhes");
  });

  it("no topo, com nada acima da linha, acende a primeira", () => {
    const ativa = subSecaoAtiva({
      ancoras: em(200, 400, 600, 800, 1000),
      linha: 80,
      rolagemTotal: 900,
    });

    expect(ativa).toBe("detalhes");
  });

  it("sem seção nenhuma devolve nulo em vez de estourar", () => {
    expect(subSecaoAtiva({ ancoras: [], linha: 80, rolagemTotal: 500 })).toBeNull();
  });

  it("a última seção se marca sozinha quando ela chega à linha", () => {
    const ativa = subSecaoAtiva({
      ancoras: em(-1200, -900, -600, -300, 40),
      linha: 80,
      rolagemTotal: 2000,
    });

    expect(ativa).toBe("sessoes");
  });
});
