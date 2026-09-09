import { describe, expect, it } from "vitest";

import { GRUPOS_DE_TOKENS, TODOS_OS_TOKENS } from "~/lib/tokens";
import vivos from "~/features/configuracoes/lib/tokens-vivos.json";

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
