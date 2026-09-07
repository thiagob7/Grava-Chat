import { describe, expect, it } from "vitest";

import {
  CORRECOES_DE_TEMA,
  pareceTemaDeFora,
} from "~/features/configuracoes/lib/correcoes-de-tema";
import { LUGARES } from "~/lib/compat-de-tema";

describe("correções para tema da referência", () => {
  it("reconhece o CSS escrito para a árvore deles", () => {
    expect(pareceTemaDeFora('[data-flx="app.guilds-layout"] { color: red }')).toBe(true);
    expect(pareceTemaDeFora('[class*="GuildNavbar.module__x_"] { color: red }')).toBe(true);
    expect(pareceTemaDeFora(":root { --ThemePanelMargin: 4px }")).toBe(true);
  });

  it("deixa passar tema escrito para o Gravaê", () => {
    expect(pareceTemaDeFora(':root { --color-brand: #123 }\n.avatar { border-radius: 0 }')).toBe(
      false,
    );
    expect(pareceTemaDeFora('[data-gc="conversa.message-item.div"] { color: red }')).toBe(false);
  });

  /*
    Uma correção sem !important perde para a folha do tema — que é justamente a
    que estamos corrigindo. Variável nossa fica de fora: o tema não declara
    nenhuma delas, então não há disputa para ganhar.
  */
  it("grita mais alto que o tema em toda declaração", () => {
    const declaracoes = CORRECOES_DE_TEMA.split("\n")
      .map((linha) => linha.trim())
      .filter((linha) => linha.endsWith(";"))
      .filter((linha) => !linha.startsWith("--"));

    expect(declaracoes.length).toBeGreaterThan(0);
    expect(declaracoes.filter((linha) => !linha.includes("!important"))).toEqual([]);
  });

  /*
    Pode mirar um nome da referência, mas só um que a gente mesma carimba. Mirar um
    que só existe na árvore deles seria escrever para um elemento que aqui nunca
    aparece — e o teste não pegaria, porque CSS que não casa não dá erro.
  */
  it("só mira nome que a ponte carimba de verdade", () => {
    const nossos = new Set<string>();

    for (const lugar of Object.values(LUGARES)) {
      for (const classe of lugar.classes as readonly string[]) nossos.add(classe);
      if ("flx" in lugar) nossos.add(lugar.flx);
    }

    const emprestados = [...CORRECOES_DE_TEMA.matchAll(/\[(?:class\*|data-flx)=["']([^"']+)["']\]/g)]
      .map((achado) => achado[1] ?? "")
      .filter((nome) => ![...nossos].some((nosso) => nosso.includes(nome)));

    expect(emprestados).toEqual([]);
  });
});
