import { describe, expect, it } from "vitest";

import { comNomesNovos } from "~/@core/lib/api-mais-velha";

describe("corpo de uma API mais velha", () => {
  it("troca o nome antigo do campo pelo novo", () => {
    expect(comNomesNovos({ pessoas: [{ nome: "Ana" }], transmitindo: true })).toEqual({
      people: [{ name: "Ana" }],
      broadcasting: true,
    });
  });

  it("não mexe quando o corpo já chegou novo", () => {
    const novo = { people: [{ name: "Ana" }], broadcasting: false };

    expect(comNomesNovos(novo)).toEqual(novo);
  });

  it("deixa o corpo novo ganhar se os dois vierem juntos", () => {
    expect(comNomesNovos({ nome: "velho", name: "novo" })).toEqual({
      nome: "velho",
      name: "novo",
    });
  });

  it("desce por lista e por objeto aninhado", () => {
    const corpo = { canais: [{ tipo: "VOICE", pessoas: [{ pronomes: "ele/dele" }] }] };

    expect(comNomesNovos(corpo)).toEqual({
      canais: [{ kind: "VOICE", people: [{ pronouns: "ele/dele" }] }],
    });
  });

  it("não toca no valor, só na chave", () => {
    const css = ":root { --color-brand: #fff }";

    expect(comNomesNovos({ texto: css, nome: "tema" })).toEqual({
      text: css,
      name: "tema",
    });
  });

  it("aguenta nulo, string e número sem quebrar", () => {
    expect(comNomesNovos(null)).toBeNull();
    expect(comNomesNovos("oi")).toBe("oi");
    expect(comNomesNovos(7)).toBe(7);
  });
});
