import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { ptBR } from "./pt-br";
import { IDIOMAS, languages, pastaDoIdioma } from "./settings";

/*
  Trinta e quatro catálogos são trinta e quatro listas da mesma coisa, e listas
  divergem.

  O TypeScript já pega chave FALTANDO — é para isso que `typeof ptBR` serve de
  molde. O que ele não pega é o resto: chave sobrando num idioma, texto vazio,
  e interpolação (`{{feito}}`) perdida na tradução, que vira um buraco no meio
  da frase e só aparece para quem usa aquele idioma.
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

/// Carregados pelo mesmo caminho que o app usa — se a pasta de um idioma não
/// existir, o teste falha aqui, que é onde deve falhar.
const catalogos = Object.fromEntries(
  await Promise.all(
    languages.map(async (lng) => {
      const modulo = (await import(`./${pastaDoIdioma(lng)}/index.ts`)) as {
        default: typeof ptBR;
      };

      return [lng, achatar(modulo.default)] as const;
    }),
  ),
);

const origem = achatar(ptBR);

describe("catálogos de tradução", () => {
  it("tem um catálogo para cada idioma anunciado", () => {
    expect(Object.keys(catalogos).sort()).toEqual([...languages].sort());
  });

  it("oferece na tela exatamente os idiomas que existem", () => {
    expect(IDIOMAS.map((i) => i.lng).sort()).toEqual([...languages].sort());
  });

  it("não repete idioma na lista da tela", () => {
    const codigos = IDIOMAS.map((i) => i.lng);

    expect(codigos).toHaveLength(new Set(codigos).size);
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

  it("não deixa texto vazio", () => {
    for (const [idioma, catalogo] of Object.entries(catalogos)) {
      const vazias = Object.entries(catalogo)
        .filter(([, texto]) => !texto.trim())
        .map(([chave]) => chave);

      expect({ idioma, vazias }).toEqual({ idioma, vazias: [] });
    }
  });

  /*
    Deixar o texto em português dentro de outro idioma é o erro mais fácil de
    cometer numa tradução em lote — e o mais difícil de ver, porque a tela
    continua funcionando. Aqui só valem os casos em que a palavra é REALMENTE
    igual entre os dois idiomas; se um dia forem muitos, é sinal de catálogo
    copiado e não traduzido.
  */
  it("não deixa um idioma inteiro em português", () => {
    for (const [idioma, catalogo] of Object.entries(catalogos)) {
      if (idioma === "pt-BR") continue;

      const iguais = Object.entries(origem).filter(
        ([chave, texto]) => catalogo[chave] === texto,
      );

      expect({ idioma, iguais: iguais.length < 20 }).toEqual({
        idioma,
        iguais: true,
      });
    }
  });

  /*
    Toda chave que a tela pede tem que existir.

    O `secoes.ts` e o modal guardam o caminho como string, e string errada não
    é erro de tipo: o i18next devolve a própria chave, e a lateral passa a
    mostrar "configuracoes.telas.conta" no lugar de "Minha conta".
  */
  it("tem tradução para toda chave que a tela pede", () => {
    const raiz = dirname(fileURLToPath(import.meta.url));
    const fontes = [
      join(raiz, "..", "components", "user-settings", "secoes.ts"),
      join(raiz, "..", "components", "user-settings", "UserSettingsModal.tsx"),
      join(raiz, "..", "components", "user-settings", "IdiomaSection.tsx"),
    ].map((caminho) => readFileSync(caminho, "utf8"));

    const pedidas = new Set(
      fontes.flatMap((src) =>
        [...src.matchAll(/"((?:configuracoes|idioma)\.[\w.]+)"/g)].map(
          (m) => m[1]!,
        ),
      ),
    );

    const semTraducao = [...pedidas].filter((chave) => !(chave in origem));

    expect(semTraducao).toEqual([]);
  });
});
