import { describe, expect, it } from "vitest";

import { partirEmAvisos } from "~/features/conversa/lib/avisos";

describe("avisos do markdown", () => {
  it("reconhece o aviso e tira o cabeçalho do corpo", () => {
    expect(partirEmAvisos("> [!NOTE]\n> olha isso")).toEqual([
      { tipo: "aviso", aviso: "note", texto: "olha isso" },
    ]);
  });

  it("aceita os cinco tipos, em qualquer caixa", () => {
    const tipos = ["note", "tip", "important", "warning", "caution"];

    for (const tipo of tipos) {
      expect(partirEmAvisos(`> [!${tipo.toUpperCase()}]\n> x`)).toEqual([
        { tipo: "aviso", aviso: tipo, texto: "x" },
      ]);
    }
  });

  it("um tipo que não existe continua sendo citação", () => {
    expect(partirEmAvisos("> [!SPOILER]\n> psiu")).toEqual([
      { tipo: "citacao", texto: "[!SPOILER]\npsiu" },
    ]);
  });

  it("citação sem cabeçalho continua citação", () => {
    expect(partirEmAvisos("> alguém disse")).toEqual([
      { tipo: "citacao", texto: "alguém disse" },
    ]);
  });

  it("separa o texto de fora do bloco", () => {
    expect(partirEmAvisos("antes\n> [!TIP]\n> dica\ndepois")).toEqual([
      { tipo: "texto", texto: "antes" },
      { tipo: "aviso", aviso: "tip", texto: "dica" },
      { tipo: "texto", texto: "depois" },
    ]);
  });

  it("linha em branco encerra o bloco", () => {
    expect(partirEmAvisos("> um\n\n> dois")).toEqual([
      { tipo: "citacao", texto: "um" },
      { tipo: "citacao", texto: "dois" },
    ]);
  });

  it("texto sem citação nenhuma sai inteiro", () => {
    expect(partirEmAvisos("oi\ntudo bem")).toEqual([
      { tipo: "texto", texto: "oi\ntudo bem" },
    ]);
  });

  it("não inventa pedaço para mensagem vazia", () => {
    expect(partirEmAvisos("")).toEqual([]);
    expect(partirEmAvisos("   ")).toEqual([]);
  });

  it("aceita `>` sem espaço e ignora seta no meio da linha", () => {
    expect(partirEmAvisos(">grudado")).toEqual([{ tipo: "citacao", texto: "grudado" }]);
    expect(partirEmAvisos("a > b")).toEqual([{ tipo: "texto", texto: "a > b" }]);
  });
});
