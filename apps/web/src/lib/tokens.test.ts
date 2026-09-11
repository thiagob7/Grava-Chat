import { describe, expect, it } from "vitest";

import { TOKENS_GROUPS, ALL_TOKENS } from "~/lib/tokens";
import live from "~/features/configuracoes/lib/tokens-vivos.json";

const LIVE = live as string[];

describe("catálogo de tokens do estúdio", () => {
  it("dá rótulo a todo token que o app lê de verdade", () => {
    const withLabel = new Set(ALL_TOKENS.map((t) => t.name));
    const withoutLabel = LIVE.filter((name) => !withLabel.has(name));

    expect(withoutLabel).toEqual([]);
  });

  it("não oferece rótulo de token morto", () => {
    const live = new Set(LIVE);
    const ghosts = ALL_TOKENS.map((t) => t.name).filter(
      (name) => !live.has(name),
    );

    expect(ghosts).toEqual([]);
  });

  it("não repete um token em dois grupos", () => {
    const names = ALL_TOKENS.map((t) => t.name);

    expect(names).toHaveLength(new Set(names).size);
  });

  it("não deixa grupo vazio nem rótulo em branco", () => {
    expect(TOKENS_GROUPS.filter((g) => !g.tokens.length)).toEqual([]);
    expect(ALL_TOKENS.filter((t) => !t.label.trim())).toEqual([]);
  });
});
