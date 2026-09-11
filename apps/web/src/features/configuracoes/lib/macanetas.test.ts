import { describe, expect, it } from "vitest";

import knobs from "~/features/configuracoes/lib/macanetas.json";
import { THEME_BRIDGE } from "~/features/configuracoes/lib/ponte-de-tema";
import { ALL_TOKENS } from "~/lib/tokens";

const MAP = knobs as Record<string, string[]>;

describe("maçanetas do tema", () => {
  it("só oferece nome que a ponte conhece", () => {
    const known = new Set(Object.keys(THEME_BRIDGE));
    const invented = Object.values(MAP)
      .flat()
      .filter((name) => !known.has(name));

    expect(invented).toEqual([]);
  });

  it("só aponta para token que o estúdio mostra", () => {
    const withLabel = new Set(ALL_TOKENS.map((t) => t.name));
    const orphans = Object.keys(MAP).filter((name) => !withLabel.has(name));

    expect(orphans).toEqual([]);
  });

  it("dá pelo menos uma maçaneta às superfícies e ao texto", () => {
    for (const token of ["--color-surface-0", "--color-surface-1", "--color-ink"])
      expect(MAP[token]?.length ?? 0).toBeGreaterThan(0);
  });
});
