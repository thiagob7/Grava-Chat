import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { enUS } from "./en-us";
import { esMX } from "./es-mx";
import { ptBR } from "./pt-br";
import { IDIOMAS, languages } from "./settings";

/*
  Três catálogos são três listas da mesma coisa, e três listas divergem.

  O TypeScript já pega chave FALTANDO — é para isso que `typeof ptBR` serve de
  molde. O que ele não pega é o resto: chave sobrando num idioma, texto deixado
  em português dentro do catálogo inglês, e interpolação (`{{feito}}`) perdida
  na tradução, que vira um buraco no meio da frase em produção.
*/
function achatar(objeto: unknown, prefixo = ""): Record<string, string> {
  const saida: Record<string, string> = {};

  for (const [chave, valor] of Object.entries(
    objeto as Record<string, unknown>,
  )) {
    const caminho = prefixo ? `${prefixo}.${chave}` : chave;

    if (typeof valor === "string") saida[caminho] = valor;
    else if (valor && typeof valor === "object")
      Object.assign(saida, achatar(valor, caminho));
  }

  return saida;
}

/// Achata a partir do NAMESPACE, e não do objeto inteiro: `defaultNS` é
/// "traducao", então o que a tela pede é `configuracoes.telas.conta` — sem o
/// prefixo. Comparar com o prefixo faria toda chave parecer faltando.
const catalogos = {
  "pt-BR": achatar(ptBR.traducao),
  "en-US": achatar(enUS.traducao),
  "es-MX": achatar(esMX.traducao),
};

const origem = catalogos["pt-BR"];

describe("catálogos de tradução", () => {
  it("tem um catálogo para cada idioma anunciado", () => {
    expect(Object.keys(catalogos).sort()).toEqual([...languages].sort());
  });

  it("oferece na tela exatamente os idiomas que existem", () => {
    expect(IDIOMAS.map((i) => i.lng).sort()).toEqual([...languages].sort());
  });

  it("nenhum idioma tem chave a mais nem a menos", () => {
    const daOrigem = Object.keys(origem).sort();

    for (const [idioma, catalogo] of Object.entries(catalogos)) {
      expect({ idioma, chaves: Object.keys(catalogo).sort() }).toEqual({
        idioma,
        chaves: daOrigem,
      });
    }
  });

  /*
    `{{feito}} de {{total}}` traduzido como "{{feito}} of {{total}}" está certo;
    traduzido sem os dois vira uma frase que perde o número. O i18next não
    reclama — ele só não interpola nada, e a tela mostra a frase truncada.
  */
  it("não perde interpolação na tradução", () => {
    for (const [idioma, catalogo] of Object.entries(catalogos)) {
      for (const [chave, texto] of Object.entries(origem)) {
        const esperadas = [...texto.matchAll(/\{\{(\w+)\}\}/g)]
          .map((m) => m[1])
          .sort();
        const traduzido = catalogo[chave] ?? "";
        const achadas = [...traduzido.matchAll(/\{\{(\w+)\}\}/g)]
          .map((m) => m[1])
          .sort();

        expect({ idioma, chave, vars: achadas }).toEqual({
          idioma,
          chave,
          vars: esperadas,
        });
      }
    }
  });

  /// Nenhum texto vazio: chave vazia some da tela sem erro nenhum, e o buraco
  /// só aparece pra quem estiver usando aquele idioma.
  it("não deixa texto vazio", () => {
    for (const [idioma, catalogo] of Object.entries(catalogos)) {
      const vazias = Object.entries(catalogo)
        .filter(([, texto]) => !texto.trim())
        .map(([chave]) => chave);

      expect({ idioma, vazias }).toEqual({ idioma, vazias: [] });
    }
  });

  /*
    Toda chave que o `secoes.ts` e o modal pedem tem que existir.

    Eles guardam o caminho como string — `configuracoes.telas.conta` — e string
    errada não é erro de tipo: o i18next devolve a própria chave, e a lateral
    passa a mostrar "configuracoes.telas.conta" no lugar de "Minha conta".
  */
  it("tem tradução para toda chave que a tela pede", () => {
    const raiz = dirname(fileURLToPath(import.meta.url));
    const fontes = [
      join(raiz, "..", "components", "user-settings", "secoes.ts"),
      join(raiz, "..", "components", "user-settings", "UserSettingsModal.tsx"),
    ].map((caminho) => readFileSync(caminho, "utf8"));

    const pedidas = new Set(
      fontes.flatMap((src) =>
        [...src.matchAll(/"(configuracoes\.[\w.]+)"/g)].map((m) => m[1]!),
      ),
    );

    const semTraducao = [...pedidas].filter((chave) => !(chave in origem));

    expect(semTraducao).toEqual([]);
  });
});
