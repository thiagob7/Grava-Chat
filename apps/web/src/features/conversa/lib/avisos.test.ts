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

  /*
    `[!SPOILER]` não é aviso — e virar citação é melhor do que sumir: quem
    escreveu queria destacar de algum jeito.
  */
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

  /*
    Linha em branco fecha o bloco. Sem isto, duas citações distantes uma da
    outra viravam uma só, com o vazio no meio.
  */
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

  /*
    `> x` e `>x` são a mesma coisa para o GitHub, e uma seta no meio da frase
    não é citação nenhuma.
  */
  it("aceita `>` sem espaço e ignora seta no meio da linha", () => {
    expect(partirEmAvisos(">grudado")).toEqual([{ tipo: "citacao", texto: "grudado" }]);
    expect(partirEmAvisos("a > b")).toEqual([{ tipo: "texto", texto: "a > b" }]);
  });
});
