import { describe, expect, it } from "vitest";

import {
  CLASSE_DO_ESCUDO,
  cssDoEscudo,
} from "~/features/configuracoes/lib/escudo-do-estudio";
import vivos from "~/features/configuracoes/lib/tokens-vivos.json";

describe("escudo do estúdio", () => {
  it("recrava todo token vivo, senão sobra porta para o tema entrar", () => {
    const base = Object.fromEntries(
      (vivos as string[]).map((nome) => [nome, "#123456"]),
    );

    const css = cssDoEscudo(base);
    const faltando = (vivos as string[]).filter(
      (nome) => !css.includes(`${nome}: #123456 !important;`),
    );

    expect(faltando).toEqual([]);
  });

  it("mira a raiz do estúdio, não a do app", () => {
    const css = cssDoEscudo({ "--color-ink": "#fff" });

    expect(css).toContain(`.${CLASSE_DO_ESCUDO} {`);
    expect(css).not.toContain(":root");
  });
});
