import { describe, expect, it } from "vitest";

import { fromNotices } from "~/features/conversa/lib/avisos";

describe("avisos do markdown", () => {
  it("reconhece o aviso e tira o cabeçalho do corpo", () => {
    expect(fromNotices("> [!NOTE]\n> olha isso")).toEqual([
      { kind: "notice", notice: "note", text: "olha isso" },
    ]);
  });

  it("aceita os cinco tipos, em qualquer caixa", () => {
    const kinds = ["note", "tip", "important", "warning", "caution"];

    for (const kind of kinds) {
      expect(fromNotices(`> [!${kind.toUpperCase()}]\n> x`)).toEqual([
        { kind: "notice", notice: kind, text: "x" },
      ]);
    }
  });

  it("um tipo que não existe continua sendo citação", () => {
    expect(fromNotices("> [!SPOILER]\n> psiu")).toEqual([
      { kind: "quote", text: "[!SPOILER]\npsiu" },
    ]);
  });

  it("citação sem cabeçalho continua citação", () => {
    expect(fromNotices("> alguém disse")).toEqual([
      { kind: "quote", text: "alguém disse" },
    ]);
  });

  it("separa o texto de fora do bloco", () => {
    expect(fromNotices("antes\n> [!TIP]\n> dica\ndepois")).toEqual([
      { kind: "texto", text: "antes" },
      { kind: "notice", notice: "tip", text: "dica" },
      { kind: "texto", text: "depois" },
    ]);
  });

  it("linha em branco encerra o bloco", () => {
    expect(fromNotices("> um\n\n> dois")).toEqual([
      { kind: "quote", text: "um" },
      { kind: "quote", text: "dois" },
    ]);
  });

  it("texto sem citação nenhuma sai inteiro", () => {
    expect(fromNotices("oi\ntudo bem")).toEqual([
      { kind: "texto", text: "oi\ntudo bem" },
    ]);
  });

  it("não inventa pedaço para mensagem vazia", () => {
    expect(fromNotices("")).toEqual([]);
    expect(fromNotices("   ")).toEqual([]);
  });

  it("aceita `>` sem espaço e ignora seta no meio da linha", () => {
    expect(fromNotices(">grudado")).toEqual([{ kind: "quote", text: "grudado" }]);
    expect(fromNotices("a > b")).toEqual([{ kind: "texto", text: "a > b" }]);
  });
});

describe("títulos e listas", () => {
  it("lê o título pelo número de sinais", () => {
    expect(fromNotices("# Um\n## Dois\n### Três")).toEqual([
      { kind: "titulo", level: 1, text: "Um" },
      { kind: "titulo", level: 2, text: "Dois" },
      { kind: "titulo", level: 3, text: "Três" },
    ]);
  });

  it("exige o espaço, para não comer nome de canal nem conta", () => {
    expect(fromNotices("#geral é ali")).toEqual([
      { kind: "texto", text: "#geral é ali" },
    ]);
    expect(fromNotices("-1 grau hoje")).toEqual([
      { kind: "texto", text: "-1 grau hoje" },
    ]);
  });

  it("junta as linhas seguidas numa lista só", () => {
    expect(fromNotices("- um\n- dois\n* três")).toEqual([
      { kind: "lista", ordered: false, items: ["um", "dois", "três"] },
    ]);
  });

  it("separa quando o marcador troca de tipo", () => {
    expect(fromNotices("- um\n1. dois")).toEqual([
      { kind: "lista", ordered: false, items: ["um"] },
      { kind: "lista", ordered: true, items: ["dois"] },
    ]);
  });

  it("deixa o texto solto em paz entre os blocos", () => {
    expect(fromNotices("olha só\n- um\ne acabou")).toEqual([
      { kind: "texto", text: "olha só" },
      { kind: "lista", ordered: false, items: ["um"] },
      { kind: "texto", text: "e acabou" },
    ]);
  });
});
