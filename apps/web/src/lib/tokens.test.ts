import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { describe, expect, it } from "vitest";

import { GRUPOS_DE_TOKENS, TODOS_OS_TOKENS } from "~/lib/tokens";

/*
  O catálogo do estúdio e o `@theme` do CSS são duas listas da mesma coisa, e
  duas listas divergem — foi o que aconteceu: o estúdio tinha 27 dos 34 tokens
  e ainda oferecia um `--color-mencao-fundo` que não existe no CSS, uma linha
  que nunca pintou nada.

  Nenhuma das duas falhas dá erro em tempo de execução. Token de fora some do
  estúdio calado; token a mais vira um seletor de cor que não faz efeito. Só um
  teste as encontra.
*/
const raiz = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(raiz, "..", "styles", "index.css"), "utf8");

function tokensDoTema(): string[] {
  const bloco = /@theme \{([\s\S]*?)\n\}/.exec(css);
  if (!bloco) throw new Error("não achei o bloco @theme no index.css");

  const corpo = bloco[1] ?? "";

  /// `m[1]` é `string | undefined` para o TypeScript mesmo com o grupo sendo
  /// obrigatório na expressão — o filtro convence, e não um `!`.
  return [...corpo.matchAll(/^\s+(--color-[\w-]+):/gm)]
    .map((m) => m[1])
    .filter((nome): nome is string => Boolean(nome));
}

describe("catálogo de tokens do estúdio", () => {
  it("cobre todo token de cor que o @theme declara", () => {
    const nomes = new Set(TODOS_OS_TOKENS.map((t) => t.nome));
    const faltando = tokensDoTema().filter((t) => !nomes.has(t));

    expect(faltando).toEqual([]);
  });

  it("não oferece token que o CSS não tem", () => {
    const doCss = new Set(tokensDoTema());
    const fantasmas = TODOS_OS_TOKENS.filter((t) => !doCss.has(t.nome)).map((t) => t.nome);

    expect(fantasmas).toEqual([]);
  });

  it("não repete um token em dois grupos", () => {
    const nomes = TODOS_OS_TOKENS.map((t) => t.nome);

    expect(nomes).toHaveLength(new Set(nomes).size);
  });

  it("dá rótulo em português a cada token", () => {
    const semRotulo = TODOS_OS_TOKENS.filter((t) => !t.rotulo.trim()).map((t) => t.nome);

    expect(semRotulo).toEqual([]);
  });

  it("não deixa grupo vazio", () => {
    const vazios = GRUPOS_DE_TOKENS.filter((g) => !g.tokens.length).map((g) => g.titulo);

    expect(vazios).toEqual([]);
  });
});
