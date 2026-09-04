import { describe, expect, it } from "vitest";

import i18next from "./i18next";
import { ptBR } from "./pt-br";

describe("trocar de idioma", () => {
  it("carrega o catálogo pedido em vez de cair no português", async () => {
    await i18next.changeLanguage("ja");

    expect(i18next.t("conversa.lista.carregando")).not.toBe(
      ptBR.conversa.lista.carregando,
    );
    expect(i18next.t("configuracoes.telas.conta")).not.toBe(
      ptBR.configuracoes.telas.conta,
    );
  });

  it("carrega TODOS os idiomas, não só o primeiro", async () => {
    const iguaisAoPortugues: string[] = [];

    for (const idioma of i18next.options.supportedLngs || []) {
      if (idioma === "pt-BR" || idioma === "cimode") continue;

      await i18next.changeLanguage(idioma);

      if (i18next.t("conversa.lista.carregando") === ptBR.conversa.lista.carregando) {
        iguaisAoPortugues.push(idioma);
      }
    }

    expect(iguaisAoPortugues).toEqual([]);
  });

  it("volta para o português", async () => {
    await i18next.changeLanguage("pt-BR");

    expect(i18next.t("conversa.lista.carregando")).toBe(
      ptBR.conversa.lista.carregando,
    );
  });
});
