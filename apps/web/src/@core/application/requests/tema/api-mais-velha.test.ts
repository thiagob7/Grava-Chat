import { describe, expect, it } from "vitest";

import { normalizeGalleryTheme } from "~/@core/application/requests/descoberta/descoberta";
import { normalizeTheme } from "~/@core/application/requests/tema/temas";

/*
  Em 10/09/2026 o app inteiro caiu em tela branca porque o web subiu com um
  campo que a API ainda não mandava: `tema.ativos` chegou `undefined` e o
  cartão de tema leu `.length` nele.

  A causa não foi o campo, foi a suposição. O web sobe sozinho quando um merge
  entra na master e a API sobe na mão — os dois nunca estão em passo, e sempre
  existe uma janela em que a tela é mais nova que o corpo que ela recebe.
*/
const OLD = {
  id: "1",
  name: "Tema de antes",
  description: null,
  author: null,
  version: null,
  tags: [],
  overrides: {},
  publishedBy: { id: "u", displayName: "Alguém", avatarUrl: null },
  createdAt: "2026-09-01T00:00:00.000Z",
};

describe("corpo de uma API mais velha", () => {
  it("o tema sem ativos vira um tema com lista vazia", () => {
    const theme = normalizeTheme({ ...OLD, css: ":root { --a: 1; }" });

    expect(theme.actives).toEqual([]);
    expect(theme.css).toBe(":root { --a: 1; }");
  });

  it("o tema da galeria sem ativos nem peso ganha os dois", () => {
    const theme = normalizeGalleryTheme({ ...OLD });

    expect(theme.actives).toEqual([]);
    expect(theme.weightBytes).toBe(0);
  });

  it("o que já vem preenchido passa intacto", () => {
    const actives = [{ name: "fundo.png", url: "https://exemplo/f.png", bytes: 2048 }];
    const theme = normalizeTheme({ ...OLD, css: "", actives });

    expect(theme.actives).toBe(actives);
  });
});
