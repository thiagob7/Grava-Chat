import { describe, expect, it } from "vitest";

import {
  THEME_FIXES,
  outsideLooksTheme,
} from "~/features/configuracoes/lib/correcoes-de-tema";
import { PLACES } from "~/lib/compat-de-tema";

describe("correções para tema da referência", () => {
  it("reconhece o CSS escrito para a árvore deles", () => {
    expect(outsideLooksTheme('[data-flx="app.guilds-layout"] { color: red }')).toBe(true);
    expect(outsideLooksTheme('[class*="GuildNavbar.module__x_"] { color: red }')).toBe(true);
    expect(outsideLooksTheme(":root { --ThemePanelMargin: 4px }")).toBe(true);
  });

  it("deixa passar tema escrito para o Gravaê", () => {
    expect(outsideLooksTheme(':root { --color-brand: #123 }\n.avatar { border-radius: 0 }')).toBe(
      false,
    );
    expect(outsideLooksTheme('[data-gc="conversa.message-item.div"] { color: red }')).toBe(false);
  });

  it("grita mais alto que o tema em toda declaração", () => {
    const declarations = THEME_FIXES.split("\n")
      .map((line) => line.trim())
      .filter((line) => line.endsWith(";"))
      .filter((line) => !line.startsWith("--"));

    expect(declarations.length).toBeGreaterThan(0);
    expect(declarations.filter((line) => !line.includes("!important"))).toEqual([]);
  });

  it("só mira nome que a ponte carimba de verdade", () => {
    const our = new Set<string>();

    for (const place of Object.values(PLACES)) {
      for (const cssClass of place.classes as readonly string[]) our.add(cssClass);
      if ("flx" in place) our.add(place.flx);
    }

    const borrowed = [...THEME_FIXES.matchAll(/\[(?:class\*|data-flx)=["']([^"']+)["']\]/g)]
      .map((match) => match[1] ?? "")
      .filter((name) => ![...our].some((our) => our.includes(name)));

    expect(borrowed).toEqual([]);
  });
});
