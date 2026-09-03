import { describe, expect, it } from "vitest";

import { subSecaoAtiva } from "./espiao-da-rolagem";

/// As cinco seções de "Minha conta", nas alturas que elas têm de verdade.
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

  /*
    O bug que ele mandou por print.

    Ele clicou em Dispositivos; a rolagem foi até o fim porque o que sobra
    embaixo cabe numa tela; e a lateral pulou para Sessões, duas seções
    adiante. A causa era uma regra de "chegou ao fim, vale a última", que
    confundia estar no fim com estar olhando a última.
  */
  it("no fim da rolagem, com quatro seções na tela, não pula para a última", () => {
    const ativa = subSecaoAtiva({
      /// Dispositivos no topo; as outras três cabem abaixo, todas visíveis.
      ancoras: em(-400, -120, 300, 560, 730),
      linha: 80,
      /// a tela ROLA bastante; estamos parados no fim dela
      rolagemTotal: 2000,
    });

    expect(ativa).not.toBe("sessoes");
  });

  /*
    Tela curta abre marcando a PRIMEIRA.

    Sem esta guarda, um painel que não rola já nasce "no fim" e qualquer regra
    de fim dispara no primeiro instante — a lateral marcava a última seção para
    sempre, sem nunca passar pelas do meio.
  */
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

  /// Antes de rolar, nada passou da linha — vale a primeira, e não "nenhuma".
  /// Lateral sem nada aceso se lê como lateral quebrada.
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

  /// Rolando até o fim de uma tela LONGA, a última chega à linha sozinha — é o
  /// caso que a regra removida tentava cobrir, e que nunca precisou dela.
  it("a última seção se marca sozinha quando ela chega à linha", () => {
    const ativa = subSecaoAtiva({
      ancoras: em(-1200, -900, -600, -300, 40),
      linha: 80,
      rolagemTotal: 2000,
    });

    expect(ativa).toBe("sessoes");
  });
});
