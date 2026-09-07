import { describe, expect, it } from "vitest";

import macanetas from "~/features/configuracoes/lib/macanetas.json";
import { PONTE_DE_TEMA } from "~/features/configuracoes/lib/ponte-de-tema";
import { TODOS_OS_TOKENS } from "~/lib/tokens";

/*
  A lista de maçanetas é gerada do `index.css` — mas gerada não quer dizer certa.
  Duas travas:

    1. toda maçaneta é um nome que a ponte conhece, senão é invenção;
    2. todo token com maçaneta tem rótulo no estúdio, senão a informação sai
       para uma tela que ninguém vê.
*/
const MAPA = macanetas as Record<string, string[]>;

describe("maçanetas do tema", () => {
  it("só oferece nome que a ponte conhece", () => {
    const conhecidos = new Set(Object.keys(PONTE_DE_TEMA));
    const inventados = Object.values(MAPA)
      .flat()
      .filter((nome) => !conhecidos.has(nome));

    expect(inventados).toEqual([]);
  });

  it("só aponta para token que o estúdio mostra", () => {
    const comRotulo = new Set(TODOS_OS_TOKENS.map((t) => t.nome));
    const orfas = Object.keys(MAPA).filter((nome) => !comRotulo.has(nome));

    expect(orfas).toEqual([]);
  });

  it("dá pelo menos uma maçaneta às superfícies e ao texto", () => {
    for (const token of ["--color-surface-0", "--color-surface-1", "--color-ink"])
      expect(MAPA[token]?.length ?? 0).toBeGreaterThan(0);
  });
});
