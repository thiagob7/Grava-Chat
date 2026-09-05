import { describe, expect, it } from "vitest";

import {
  CORRECOES_DO_FLUXER,
  pareceTemaDoFluxer,
} from "~/features/configuracoes/lib/correcoes-do-fluxer";

describe("correções para tema do Fluxer", () => {
  it("reconhece o CSS escrito para a árvore deles", () => {
    expect(pareceTemaDoFluxer('[data-flx="app.guilds-layout"] { color: red }')).toBe(true);
    expect(pareceTemaDoFluxer('[class*="GuildNavbar.module__x_"] { color: red }')).toBe(true);
    expect(pareceTemaDoFluxer(":root { --ThemePanelMargin: 4px }")).toBe(true);
  });

  it("deixa passar tema escrito para o Gravaê", () => {
    expect(pareceTemaDoFluxer(':root { --color-brand: #123 }\n.avatar { border-radius: 0 }')).toBe(
      false,
    );
    expect(pareceTemaDoFluxer('[data-gc="conversa.message-item.div"] { color: red }')).toBe(false);
  });

  /*
    Uma correção sem !important perde para a folha do tema — que é justamente a
    que estamos corrigindo.
  */
  it("grita mais alto que o tema em toda declaração", () => {
    const declaracoes = CORRECOES_DO_FLUXER.split("\n")
      .map((linha) => linha.trim())
      .filter((linha) => linha.endsWith(";"));

    expect(declaracoes.length).toBeGreaterThan(0);
    expect(declaracoes.filter((linha) => !linha.includes("!important"))).toEqual([]);
  });

  it("só mira gancho nosso, para não depender da árvore deles", () => {
    const seletores = CORRECOES_DO_FLUXER.match(/^[.\[][^{]*/gm) ?? [];

    expect(seletores.filter((s) => s.includes("module__") || s.includes("data-flx"))).toEqual([]);
  });
});
