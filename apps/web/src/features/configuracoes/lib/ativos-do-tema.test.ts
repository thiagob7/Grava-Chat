import { describe, expect, it } from "vitest";

import {
  contarPedidosDeAtivo,
  resolverAtivos,
} from "~/features/configuracoes/lib/ativos-do-tema";

const ATIVOS = [
  { nome: "fundo.png", url: "https://cdn/1.png" },
  { nome: "Papel De Parede.JPG", url: "https://cdn/2.jpg" },
];

describe("ativos do tema", () => {
  it("troca o nome pelo endereço do arquivo", () => {
    const { css } = resolverAtivos(
      `body { background: gc-ativo("fundo"); }`,
      ATIVOS,
    );

    expect(css).toBe(`body { background: url("https://cdn/1.png"); }`);
  });

  it("aceita o nome com extensão, e não liga para maiúscula", () => {
    const { css } = resolverAtivos(
      `a { background: gc-ativo("PAPEL DE PAREDE.jpg"); }`,
      ATIVOS,
    );

    expect(css).toContain(`url("https://cdn/2.jpg")`);
  });

  it("entende o nome da referência do mesmo jeito", () => {
    const { css } = resolverAtivos(
      `a { background: fluxer-theme-asset("fundo"); }`,
      ATIVOS,
    );

    expect(css).toContain(`url("https://cdn/1.png")`);
  });

  /*
    Deixar como está faz a declaração inteira ser inválida, e o navegador a
    ignora. Trocar por vazio pintaria por cima e a pessoa acharia que o tema é
    assim mesmo.
  */
  it("deixa quieto o que não existe, e diz o que faltou", () => {
    const { css, faltando } = resolverAtivos(
      `a { background: gc-ativo("sumido"); }`,
      ATIVOS,
    );

    expect(css).toContain(`gc-ativo("sumido")`);
    expect(faltando).toEqual(["sumido"]);
  });

  it("conta quantos arquivos o tema pede", () => {
    expect(
      contarPedidosDeAtivo(`a{background:gc-ativo("a")}b{border-image:gc-ativo('b')}`),
    ).toBe(2);
  });

  it("não mexe em CSS que não pede arquivo nenhum", () => {
    const css = `a { background: url("https://ja/pronto.png"); }`;

    expect(resolverAtivos(css, ATIVOS).css).toBe(css);
  });
});
