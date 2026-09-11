import { describe, expect, it } from "vitest";

import { SOUNDS_GROUPS, SOUNDS_NAMES, ALL_SOUNDS } from "~/lib/ui-sounds";

describe("catálogo de sons", () => {
  it("cobre todo som que o app sabe tocar", () => {
    const listed = new Set(ALL_SOUNDS.map((s) => s.name));
    const missing = SOUNDS_NAMES.filter((name) => !listed.has(name));

    expect(missing).toEqual([]);
  });

  it("não repete um som em dois grupos", () => {
    const names = ALL_SOUNDS.map((s) => s.name);

    expect(names).toHaveLength(new Set(names).size);
  });

  it("dá rótulo e um 'quando' a cada som", () => {
    const incomplete = ALL_SOUNDS.filter((s) => !s.label.trim() || !s.when.trim()).map(
      (s) => s.name,
    );

    expect(incomplete).toEqual([]);
  });

  it("não deixa grupo vazio", () => {
    expect(SOUNDS_GROUPS.filter((g) => !g.sounds.length).map((g) => g.title)).toEqual([]);
  });
});
