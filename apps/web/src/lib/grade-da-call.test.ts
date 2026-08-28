import { describe, expect, it } from "vitest";

import { focar, formatoDaGrade, montarGrade } from "./grade-da-call";

const pessoa = (identity: string, transmitindo = false) => ({ identity, transmitindo });

describe("montarGrade", () => {
  it("quem não transmite ocupa um quadro só", () => {
    const grade = montarGrade([pessoa("ana"), pessoa("bia")]);

    expect(grade.map((q) => q.key)).toEqual(["ana", "bia"]);
    expect(grade.every((q) => q.tipo === "pessoa")).toBe(true);
  });

  /*
    O comportamento que motivou o módulo. Antes a transmissão era desenhada
    POR CIMA do quadro da pessoa, e o avatar dela sumia — abrir uma live fazia
    o dono da live desaparecer da chamada.
  */
  it("quem transmite ocupa dois quadros: a pessoa e a live", () => {
    const grade = montarGrade([pessoa("ana", true)]);

    expect(grade).toHaveLength(2);
    expect(grade.map((q) => q.tipo)).toEqual(["pessoa", "tela"]);
    expect(grade.map((q) => q.key)).toEqual(["ana", "ana:tela"]);
  });

  it("a live fica ao lado de quem a abriu, não no fim da lista", () => {
    const grade = montarGrade([pessoa("ana"), pessoa("bia", true), pessoa("caio")]);

    expect(grade.map((q) => q.key)).toEqual(["ana", "bia", "bia:tela", "caio"]);
  });

  it("as chaves não colidem quando várias pessoas transmitem", () => {
    const grade = montarGrade([pessoa("ana", true), pessoa("bia", true)]);
    const chaves = grade.map((q) => q.key);

    expect(new Set(chaves).size).toBe(chaves.length);
  });

  it("o quadro carrega o participante de origem — a live sabe de quem é", () => {
    const tela = montarGrade([pessoa("ana", true)]).find((q) => q.tipo === "tela");

    expect(tela?.de.identity).toBe("ana");
  });

  it("sala vazia não gera quadro", () => {
    expect(montarGrade([])).toEqual([]);
  });
});

describe("formatoDaGrade", () => {
  it("uma pessoa sozinha ocupa a largura toda", () => {
    expect(formatoDaGrade(1).colunas).toBe(1);
  });

  it("as colunas crescem com a quantidade em vez de travar em três", () => {
    // era o teto antigo: 15 quadros viravam 5 fileiras e estouravam a altura
    expect(formatoDaGrade(4).colunas).toBe(2);
    expect(formatoDaGrade(9).colunas).toBe(3);
    expect(formatoDaGrade(15).colunas).toBe(4);
    expect(formatoDaGrade(20).colunas).toBe(5);
  });

  it("as colunas nunca passam de cinco, senão o quadro fica ilegível", () => {
    expect(formatoDaGrade(50).colunas).toBe(5);
  });

  it("chamada pequena não usa o modo denso", () => {
    expect(formatoDaGrade(4).denso).toBe(false);
    expect(formatoDaGrade(9).denso).toBe(false);
  });

  it("chamada grande entra no modo denso pra caber sem rolagem", () => {
    expect(formatoDaGrade(10).denso).toBe(true);
    expect(formatoDaGrade(15).denso).toBe(true);
  });

  it("nunca devolve zero coluna, nem com a sala vazia", () => {
    // grid-template-columns: repeat(0, …) apaga a grade inteira
    expect(formatoDaGrade(0).colunas).toBeGreaterThanOrEqual(1);
  });
});

describe("focar", () => {
  const quadros = montarGrade([pessoa("ana"), pessoa("bia", true), pessoa("caio")]);

  it("sem foco, não há destaque", () => {
    expect(focar(quadros, null)).toBeNull();
  });

  it("o quadro focado vira destaque e sai da faixa", () => {
    const foco = focar(quadros, "bia:tela");

    expect(foco?.destaque.key).toBe("bia:tela");
    expect(foco?.faixa.map((q) => q.key)).toEqual(["ana", "bia", "caio"]);
  });

  it("a faixa preserva a ordem original", () => {
    expect(focar(quadros, "ana")?.faixa.map((q) => q.key)).toEqual(["bia", "bia:tela", "caio"]);
  });

  /*
    Quem estava em destaque pode sair da chamada ou encerrar a transmissão. Sem
    devolver `null`, a tela ficaria presa num destaque que não existe mais.
  */
  it("foco em quadro que sumiu volta pra grade normal", () => {
    expect(focar(quadros, "alguem-que-saiu")).toBeNull();
  });
});
