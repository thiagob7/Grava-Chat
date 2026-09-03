import { describe, expect, it } from "vitest";

import { corDaPosicao, escreverCor, lerCor, posicaoDaCor } from "./color-picker";

/*
  O seletor é feito de duas conversões, e é nelas que mora o erro que não
  aparece na tela: uma cor levemente errada continua sendo uma cor.

  O componente que serviu de base erra exatamente aqui — ele lê um valor
  controlado com `setHue(cor.r)`, mandando o canal VERMELHO para o matiz. Como
  o resultado ainda é uma cor, nada quebra: só sai a cor errada. Estes testes
  são a rede embaixo dessa troca.
*/
describe("ler e escrever cor", () => {
  it("lê os dois formatos em que os tokens do tema estão escritos", () => {
    /// 138 tokens em hexadecimal e 23 em `rgb(r g b / a)`, com a barra.
    expect(lerCor("#1a181e")).toMatchObject({ a: 1 });
    expect(lerCor("rgb(201 197 211 / 0.15)")).toMatchObject({ a: 0.15 });
  });

  it("devolve nulo no que não é cor, em vez de estourar", () => {
    expect(lerCor("color-mix(in oklab, red, blue)")).toBeNull();
    expect(lerCor("")).toBeNull();
    expect(lerCor("var(--color-brand)")).toBeNull();
  });

  /*
    A ida e volta é o que garante que abrir o seletor num token e fechar sem
    mexer não reescreve o token com outra cor.
  */
  it("mantém a cor na ida e na volta", () => {
    for (const original of ["#1a181e", "#2a2730", "#5865f2", "#ffffff", "#000000"]) {
      expect(escreverCor(lerCor(original)!)).toBe(original);
    }
  });

  it("mantém a opacidade na ida e na volta", () => {
    expect(escreverCor(lerCor("rgb(201 197 211 / 0.15)")!)).toBe(
      "rgb(201 197 211 / 0.15)",
    );
  });

  /// Opaca sai em hexadecimal e translúcida sai em `rgb(... / a)`, que é como
  /// a folha de estilo escreve cada uma.
  it("escolhe o formato pela opacidade", () => {
    expect(escreverCor({ h: 260, s: 11, l: 11, a: 1 })).toMatch(/^#[0-9a-f]{6}$/);
    expect(escreverCor({ h: 260, s: 11, l: 11, a: 0.5 })).toMatch(/^rgb\(.+ \/ 0\.5\)$/);
  });

  /// Cinza puro não tem matiz e o `color` devolve `NaN` — que viraria uma
  /// bolinha em `left: NaN%` e um seletor travado.
  it("não deixa NaN escapar no cinza", () => {
    expect(lerCor("#808080")!.h).toBe(0);
    expect(Number.isFinite(lerCor("#ffffff")!.h)).toBe(true);
  });

  /*
    A bolinha tem que cair onde o dedo caiu.

    São duas contas inversas — a que traduz o arrasto em cor e a que traduz a
    cor em posição. Enquanto a fórmula estava escrita duas vezes no componente,
    nada impedia que só uma mudasse: o sintoma seria a bolinha andando sozinha
    para o lado a cada clique, e é o tipo de coisa que só se descobre usando.
  */
  it("a posição da bolinha é o inverso exato do arrasto", () => {
    for (const x of [0, 0.25, 0.5, 0.75, 1]) {
      for (const y of [0, 0.3, 0.6, 1]) {
        const volta = posicaoDaCor(corDaPosicao(x, y));

        expect(volta.x).toBeCloseTo(x, 6);
        expect(volta.y).toBeCloseTo(y, 6);
      }
    }
  });

  /// Abrir o seletor num token e não mexer não pode jogar a bolinha pra fora:
  /// a posição vem da cor lida, e tem que ser um ponto de verdade dentro do
  /// quadrado — nem NaN, nem fora de 0–1.
  it("acha a bolinha para as cores que os tokens realmente têm", () => {
    for (const token of ["#1a181e", "#2a2730", "#5865f2", "#ffffff", "#000000"]) {
      const { x, y } = posicaoDaCor(lerCor(token)!);

      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(1);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(1);
    }
  });
});
