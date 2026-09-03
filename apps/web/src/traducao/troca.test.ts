import { describe, expect, it } from "vitest";

import i18next from "./i18next";
import { ptBR } from "./pt-br";

/*
  Trocar de idioma tem que trocar o TEXTO, e nenhum teste dizia isso.

  O `traducao.test.ts` do lado confere os catálogos: que os trinta e quatro têm
  as mesmas chaves, que ninguém deixou frase vazia, que a interpolação
  sobreviveu. Todos passavam, e a tela continuava em português — porque o
  problema não estava em catálogo nenhum, estava na ligação entre eles e o app.

  O `resources` (que entrega o português pronto) e o backend de `import()` não
  convivem sem `partialBundledLanguages: true`: o `loadResources` do i18next
  desiste na primeira linha, e o backend nunca é chamado. Sem erro, sem aviso —
  `changeLanguage` resolve, tudo redesenha, e cada chave cai no fallback.

  Daí este arquivo separado: ele não olha o conteúdo dos catálogos, olha se
  eles CHEGAM. É o único teste aqui que passa pelo i18next de verdade, com o
  mesmo `import()` que o navegador vai fazer.
*/
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

  /*
    Um idioma por vez não bastaria: o japonês podia ser o único com pasta no
    lugar. Aqui passam os trinta e três, um a um, e cada um precisa mudar pelo
    menos um texto conhecido.

    "Carregando mensagens…" é a frase escolhida porque não tem nome próprio nem
    número dentro: qualquer idioma a escreve diferente do português, sem o risco
    de coincidência que uma palavra curta traria.
  */
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

  /// Volta o estado como estava: os testes deste arquivo mexem num i18next que
  /// é singleton, e deixar o japonês ligado sujaria qualquer teste que rodasse
  /// depois no mesmo processo.
  it("volta para o português", async () => {
    await i18next.changeLanguage("pt-BR");

    expect(i18next.t("conversa.lista.carregando")).toBe(
      ptBR.conversa.lista.carregando,
    );
  });
});
