import { describe, expect, it } from "vitest";

import { focus, formatGrid, buildGrid } from "./grade-da-call";

const person = (identity: string, broadcasting = false) => ({ identity, broadcasting });

describe("montarGrade", () => {
  it("quem não transmite ocupa um quadro só", () => {
    const grid = buildGrid([person("ana"), person("bia")]);

    expect(grid.map((q) => q.key)).toEqual(["ana", "bia"]);
    expect(grid.every((q) => q.kind === "pessoa")).toBe(true);
  });

  it("quem transmite ocupa dois quadros: a pessoa e a live", () => {
    const grid = buildGrid([person("ana", true)]);

    expect(grid).toHaveLength(2);
    expect(grid.map((q) => q.kind)).toEqual(["pessoa", "tela"]);
    expect(grid.map((q) => q.key)).toEqual(["ana", "ana:tela"]);
  });

  it("a live fica ao lado de quem a abriu, não no fim da lista", () => {
    const grid = buildGrid([person("ana"), person("bia", true), person("caio")]);

    expect(grid.map((q) => q.key)).toEqual(["ana", "bia", "bia:tela", "caio"]);
  });

  it("as chaves não colidem quando várias pessoas transmitem", () => {
    const grid = buildGrid([person("ana", true), person("bia", true)]);
    const keys = grid.map((q) => q.key);

    expect(new Set(keys).size).toBe(keys.length);
  });

  it("o quadro carrega o participante de origem — a live sabe de quem é", () => {
    const display = buildGrid([person("ana", true)]).find((q) => q.kind === "tela");

    expect(display?.de.identity).toBe("ana");
  });

  it("sala vazia não gera quadro", () => {
    expect(buildGrid([])).toEqual([]);
  });
});

describe("formatoDaGrade", () => {
  it("uma pessoa sozinha ocupa a largura toda", () => {
    expect(formatGrid(1).columns).toBe(1);
  });

  it("as colunas crescem com a quantidade em vez de travar em três", () => {
    expect(formatGrid(4).columns).toBe(2);
    expect(formatGrid(9).columns).toBe(3);
    expect(formatGrid(15).columns).toBe(4);
    expect(formatGrid(20).columns).toBe(5);
  });

  it("as colunas nunca passam de cinco, senão o quadro fica ilegível", () => {
    expect(formatGrid(50).columns).toBe(5);
  });

  it("chamada pequena não usa o modo denso", () => {
    expect(formatGrid(4).dense).toBe(false);
    expect(formatGrid(9).dense).toBe(false);
  });

  it("chamada grande entra no modo denso pra caber sem rolagem", () => {
    expect(formatGrid(10).dense).toBe(true);
    expect(formatGrid(15).dense).toBe(true);
  });

  it("nunca devolve zero coluna, nem com a sala vazia", () => {
    expect(formatGrid(0).columns).toBeGreaterThanOrEqual(1);
  });
});

describe("focar", () => {
  const frames = buildGrid([person("ana"), person("bia", true), person("caio")]);

  it("sem foco, não há destaque", () => {
    expect(focus(frames, null)).toBeNull();
  });

  it("o quadro focado vira destaque e sai da faixa", () => {
    const spotlight = focus(frames, "bia:tela");

    expect(spotlight?.highlight.key).toBe("bia:tela");
    expect(spotlight?.track.map((q) => q.key)).toEqual(["ana", "bia", "caio"]);
  });

  it("a faixa preserva a ordem original", () => {
    expect(focus(frames, "ana")?.track.map((q) => q.key)).toEqual(["bia", "bia:tela", "caio"]);
  });

  it("foco em quadro que sumiu volta pra grade normal", () => {
    expect(focus(frames, "alguem-que-saiu")).toBeNull();
  });

  it("quadro sozinho vira destaque com faixa vazia", () => {
    const spotlight = focus(buildGrid([person("ana")]), "ana");

    expect(spotlight?.highlight.key).toBe("ana");
    expect(spotlight?.track).toEqual([]);
  });
});
