import { describe, expect, it } from "vitest";

import { GRUPOS_DE_SONS, NOMES_DOS_SONS, TODOS_OS_SONS } from "~/lib/ui-sounds";

describe("catálogo de sons", () => {
  it("cobre todo som que o app sabe tocar", () => {
    const listados = new Set(TODOS_OS_SONS.map((s) => s.nome));
    const faltando = NOMES_DOS_SONS.filter((nome) => !listados.has(nome));

    expect(faltando).toEqual([]);
  });

  it("não repete um som em dois grupos", () => {
    const nomes = TODOS_OS_SONS.map((s) => s.nome);

    expect(nomes).toHaveLength(new Set(nomes).size);
  });

  it("dá rótulo e um 'quando' a cada som", () => {
    const incompletos = TODOS_OS_SONS.filter((s) => !s.rotulo.trim() || !s.quando.trim()).map(
      (s) => s.nome,
    );

    expect(incompletos).toEqual([]);
  });

  it("não deixa grupo vazio", () => {
    expect(GRUPOS_DE_SONS.filter((g) => !g.sons.length).map((g) => g.titulo)).toEqual([]);
  });
});
