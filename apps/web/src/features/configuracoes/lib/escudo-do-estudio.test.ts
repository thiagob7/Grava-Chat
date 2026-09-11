import { describe, expect, it } from "vitest";

import {
  SHIELD_CLASS,
  shieldCss,
} from "~/features/configuracoes/lib/escudo-do-estudio";
import live from "~/features/configuracoes/lib/tokens-vivos.json";

describe("escudo do estúdio", () => {
  it("recrava todo token vivo, senão sobra porta para o tema entrar", () => {
    const base = Object.fromEntries(
      (live as string[]).map((name) => [name, "#123456"]),
    );

    const css = shieldCss(base);
    const missing = (live as string[]).filter(
      (name) => !css.includes(`${name}: #123456 !important;`),
    );

    expect(missing).toEqual([]);
  });

  it("mira a raiz do estúdio, não a do app", () => {
    const css = shieldCss({ "--color-ink": "#fff" });

    expect(css).toContain(`.${SHIELD_CLASS} {`);
    expect(css).not.toContain(":root");
  });
});
