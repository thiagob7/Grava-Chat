import { describe, expect, it } from "vitest";

import { partirEmCodigo, rotuloDaLingua } from "./codigo";

describe("partirEmCodigo", () => {
  it("texto sem crase sai inteiro, num pedaço só", () => {
    expect(partirEmCodigo("oi, tudo bem?")).toEqual([
      { tipo: "texto", texto: "oi, tudo bem?" },
    ]);
  });

  it("guarda a língua da cerca e tira a quebra que sobra no fim", () => {
    expect(partirEmCodigo('```json\n{ "a": 1 }\n```')).toEqual([
      { tipo: "bloco", codigo: '{ "a": 1 }', lingua: "json" },
    ]);
  });

  it("sem língua o bloco continua bloco", () => {
    expect(partirEmCodigo("```\nls -la\n```")).toEqual([
      { tipo: "bloco", codigo: "ls -la", lingua: null },
    ]);
  });

  it("do informe só a primeira palavra vira língua", () => {
    const [bloco] = partirEmCodigo("```sh # instala\nyarn\n```");
    expect(bloco).toEqual({ tipo: "bloco", codigo: "yarn", lingua: "sh" });
  });

  it("separa o texto de antes e o de depois da cerca", () => {
    expect(partirEmCodigo("olha:\n```ts\nconst a = 1;\n```\npronto")).toEqual([
      { tipo: "texto", texto: "olha:\n" },
      { tipo: "bloco", codigo: "const a = 1;", lingua: "ts" },
      { tipo: "texto", texto: "\npronto" },
    ]);
  });

  it("crase solta no meio da frase é código de linha", () => {
    expect(partirEmCodigo("roda `yarn dev` aí")).toEqual([
      { tipo: "texto", texto: "roda " },
      { tipo: "linha", codigo: "yarn dev" },
      { tipo: "texto", texto: " aí" },
    ]);
  });

  it("cerca vazia é só alguém escrevendo crase, não bloco", () => {
    expect(partirEmCodigo("``` ```")).toEqual([{ tipo: "texto", texto: "``` ```" }]);
  });

  it("link dentro da cerca fica no código, longe do enriquecedor", () => {
    expect(partirEmCodigo("```\nhttps://gravae.io :teste: <@000000000000000000000000>\n```")).toEqual([
      {
        tipo: "bloco",
        codigo: "https://gravae.io :teste: <@000000000000000000000000>",
        lingua: null,
      },
    ]);
  });

  it("duas cercas seguidas viram dois blocos", () => {
    const pedacos = partirEmCodigo("```js\na\n```\ne\n```py\nb\n```");
    expect(pedacos.map((p) => p.tipo)).toEqual(["bloco", "texto", "bloco"]);
  });

  it("cerca aberta e não fechada continua sendo texto", () => {
    expect(partirEmCodigo("```js\nconst a = 1;")).toEqual([
      { tipo: "texto", texto: "```js\nconst a = 1;" },
    ]);
  });
});

describe("rotuloDaLingua", () => {
  it("normaliza o apelido, seja qual for a caixa", () => {
    expect(rotuloDaLingua("js")).toBe("JavaScript");
    expect(rotuloDaLingua("JSON")).toBe("JSON");
    expect(rotuloDaLingua("  ts  ")).toBe("TypeScript");
  });

  it("o que não está na tabela aparece como veio, com maiúscula", () => {
    expect(rotuloDaLingua("zig")).toBe("Zig");
  });

  it("sem língua, o cabeçalho ainda diz o que é", () => {
    expect(rotuloDaLingua(null)).toBe("Código");
    expect(rotuloDaLingua("")).toBe("Código");
  });
});
