import { describe, expect, it } from "vitest";

import {
  countActiveRequests,
  resolveActive,
} from "~/features/configuracoes/lib/ativos-do-tema";

const ACTIVE = [
  { name: "fundo.png", url: "https://cdn/1.png" },
  { name: "Papel De Parede.JPG", url: "https://cdn/2.jpg" },
];

describe("ativos do tema", () => {
  it("troca o nome pelo endereço do arquivo", () => {
    const { css } = resolveActive(
      `body { background: gc-ativo("fundo"); }`,
      ACTIVE,
    );

    expect(css).toBe(`body { background: url("https://cdn/1.png"); }`);
  });

  it("aceita o nome com extensão, e não liga para maiúscula", () => {
    const { css } = resolveActive(
      `a { background: gc-ativo("PAPEL DE PAREDE.jpg"); }`,
      ACTIVE,
    );

    expect(css).toContain(`url("https://cdn/2.jpg")`);
  });

  it("deixa quieto o que não existe, e diz o que faltou", () => {
    const { css, missing } = resolveActive(
      `a { background: gc-ativo("sumido"); }`,
      ACTIVE,
    );

    expect(css).toContain(`gc-ativo("sumido")`);
    expect(missing).toEqual(["sumido"]);
  });

  it("conta quantos arquivos o tema pede", () => {
    expect(
      countActiveRequests(`a{background:gc-ativo("a")}b{border-image:gc-ativo('b')}`),
    ).toBe(2);
  });

  it("não mexe em CSS que não pede arquivo nenhum", () => {
    const css = `a { background: url("https://ja/pronto.png"); }`;

    expect(resolveActive(css, ACTIVE).css).toBe(css);
  });
});
