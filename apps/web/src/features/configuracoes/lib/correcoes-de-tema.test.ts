import { describe, expect, it } from "vitest";

import {
  CORRECOES_DO_FLUXER,
  pareceTemaDoFluxer,
} from "~/features/configuracoes/lib/correcoes-do-fluxer";
import { LUGARES } from "~/lib/compat-fluxer";

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
    que estamos corrigindo. Variável nossa fica de fora: o tema não declara
    nenhuma delas, então não há disputa para ganhar.
  */
  it("grita mais alto que o tema em toda declaração", () => {
    const declaracoes = CORRECOES_DO_FLUXER.split("\n")
      .map((linha) => linha.trim())
      .filter((linha) => linha.endsWith(";"))
      .filter((linha) => !linha.startsWith("--"));

    expect(declaracoes.length).toBeGreaterThan(0);
    expect(declaracoes.filter((linha) => !linha.includes("!important"))).toEqual([]);
  });

  /*
    Pode mirar um nome do Fluxer, mas só um que a gente mesma carimba. Mirar um
    que só existe na árvore deles seria escrever para um elemento que aqui nunca
    aparece — e o teste não pegaria, porque CSS que não casa não dá erro.
  */
  it("só mira nome que a ponte carimba de verdade", () => {
    const nossos = new Set<string>();

    for (const lugar of Object.values(LUGARES)) {
      for (const classe of lugar.classes as readonly string[]) nossos.add(classe);
      if ("flx" in lugar) nossos.add(lugar.flx);
    }

    const emprestados = [...CORRECOES_DO_FLUXER.matchAll(/\[(?:class\*|data-flx)=["']([^"']+)["']\]/g)]
      .map((achado) => achado[1] ?? "")
      .filter((nome) => ![...nossos].some((nosso) => nosso.includes(nome)));

    expect(emprestados).toEqual([]);
  });
});
