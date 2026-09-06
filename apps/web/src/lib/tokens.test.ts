import { describe, expect, it } from "vitest";

import { GRUPOS_DE_TOKENS, TODOS_OS_TOKENS } from "~/lib/tokens";
import vivos from "~/features/configuracoes/lib/tokens-vivos.json";

/*
  A trava antiga tinha sete invariantes e mesmo assim deixava passar 450 campos
  mortos. Ela media o catálogo contra o CSS-FONTE, e perguntava "o nome aparece
  em algum lugar?" — e todo `--color-*` aparece na própria declaração do @theme.
  Cada token dava a si mesmo o atestado de vivo.

  Agora a pergunta é outra e vem de fora: `scripts/tokens-vivos.mjs` lê o CSS
  CONSTRUÍDO e junta o que alguma regra de componente consome de verdade. Sobram
  duas invariantes, e elas fecham os dois lados:

    1. todo token vivo tem rótulo — o estúdio não esconde nada que pinta;
    2. nenhum rótulo aponta para token morto — o estúdio não oferece campo que
       não faz nada.

  Que o JSON esteja em dia com o build é assunto do `--check`, no CI: aqui não
  há `dist` para ler.
*/
const VIVOS = vivos as string[];

describe("catálogo de tokens do estúdio", () => {
  it("dá rótulo a todo token que o app lê de verdade", () => {
    const comRotulo = new Set(TODOS_OS_TOKENS.map((t) => t.nome));
    const semRotulo = VIVOS.filter((nome) => !comRotulo.has(nome));

    expect(semRotulo).toEqual([]);
  });

  it("não oferece rótulo de token morto", () => {
    const vivo = new Set(VIVOS);
    const fantasmas = TODOS_OS_TOKENS.map((t) => t.nome).filter(
      (nome) => !vivo.has(nome),
    );

    expect(fantasmas).toEqual([]);
  });

  it("não repete um token em dois grupos", () => {
    const nomes = TODOS_OS_TOKENS.map((t) => t.nome);

    expect(nomes).toHaveLength(new Set(nomes).size);
  });

  it("não deixa grupo vazio nem rótulo em branco", () => {
    expect(GRUPOS_DE_TOKENS.filter((g) => !g.tokens.length)).toEqual([]);
    expect(TODOS_OS_TOKENS.filter((t) => !t.rotulo.trim())).toEqual([]);
  });
});
