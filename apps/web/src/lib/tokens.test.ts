import { existsSync, readdirSync, readFileSync } from "node:fs";
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
const camada = readFileSync(join(raiz, "..", "styles", "tokens.css"), "utf8");

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

/// Os nomes da referência, do bloco `:root` do `tokens.css`. Só o primeiro
/// bloco interessa: os outros são os temas, e todo token que eles ajustam já
/// nasceu ali.
function tokensDaCamada(): string[] {
  const bloco = /:root \{([\s\S]*?)\n\}/.exec(camada);
  if (!bloco) throw new Error("não achei o :root no tokens.css");

  return [...(bloco[1] ?? "").matchAll(/^\s+(--[\w-]+):/gm)]
    .map((m) => m[1])
    .filter((nome): nome is string => Boolean(nome));
}

/*
  Onde procurar por uso de verdade.

  Um token está LIGADO quando alguma coisa lê ele: os `--color-*` pelas classes
  do Tailwind (`bg-surface-2`), os demais por `var(--nome)` no código ou no CSS.
  Sem isto a marca do catálogo seria uma promessa que ninguém confere — e a
  promessa aqui é justamente "mexer nisto muda a tela".
*/
const fontes = [
  "components",
  "lib",
  "hooks",
  "stores",
  "styles",
  "pages",
  "@core",
]
  .map((pasta) => join(raiz, "..", pasta))
  .filter((caminho) => existsSync(caminho));

function todoOCodigo(): string {
  const partes: string[] = [];

  const andar = (pasta: string) => {
    for (const item of readdirSync(pasta, { withFileTypes: true })) {
      const caminho = join(pasta, item.name);

      if (item.isDirectory()) andar(caminho);
      /*
        O `tokens.css` fica de fora: metade dos tokens da referência é definida
        em função de outro (`calc(var(--spacing-2) ...)`), e contar isso como
        uso faria a camada declarar-se ligada sozinha. Ligado é o APP lendo o
        token, não o token lendo a si mesmo.
      */
      else if (
        /\.(tsx?|css)$/.test(item.name) &&
        !item.name.endsWith(".test.ts") &&
        item.name !== "tokens.css"
      ) {
        partes.push(readFileSync(caminho, "utf8"));
      }
    }
  };

  fontes.forEach(andar);
  return partes.join("\n");
}

describe("catálogo de tokens do estúdio", () => {
  it("cobre todo token de cor que o @theme declara", () => {
    const nomes = new Set(TODOS_OS_TOKENS.map((t) => t.nome));
    const faltando = tokensDoTema().filter((t) => !nomes.has(t));

    expect(faltando).toEqual([]);
  });

  it("cobre todo token da camada da referência", () => {
    const nomes = new Set(TODOS_OS_TOKENS.map((t) => t.nome));
    const faltando = tokensDaCamada().filter((t) => !nomes.has(t));

    expect(faltando).toEqual([]);
  });

  it("não oferece token que o CSS não tem", () => {
    const doCss = new Set([...tokensDoTema(), ...tokensDaCamada()]);
    const fantasmas = TODOS_OS_TOKENS.filter((t) => !doCss.has(t.nome)).map(
      (t) => t.nome,
    );

    expect(fantasmas).toEqual([]);
  });

  /*
    A marca `ligado` é a única coisa que separa um seletor de cor que funciona
    de um que aceita o clique e não muda nada. Ela envelhece sozinha — todo
    componente que passa a ler um token novo deixa a marca desatualizada —, e é
    por isso que ela é conferida contra o código, e não contra a boa intenção.
  */
  it("só marca como ligado o token que alguma coisa realmente lê", () => {
    const codigo = todoOCodigo();

    const mentindo = TODOS_OS_TOKENS.filter((t) => t.ligado).filter((t) => {
      if (t.nome.startsWith("--color-")) return !codigo.includes(t.nome);
      return !codigo.includes(`var(${t.nome})`);
    });

    expect(mentindo.map((t) => t.nome)).toEqual([]);
  });

  it("não deixa de fora token que já está sendo lido", () => {
    const codigo = todoOCodigo();

    const esquecidos = TODOS_OS_TOKENS.filter((t) => !t.ligado)
      .filter((t) => codigo.includes(`var(${t.nome})`))
      .map((t) => t.nome);

    expect(esquecidos).toEqual([]);
  });

  it("não repete um token em dois grupos", () => {
    const nomes = TODOS_OS_TOKENS.map((t) => t.nome);

    expect(nomes).toHaveLength(new Set(nomes).size);
  });

  it("dá rótulo em português a cada token", () => {
    const semRotulo = TODOS_OS_TOKENS.filter((t) => !t.rotulo.trim()).map(
      (t) => t.nome,
    );

    expect(semRotulo).toEqual([]);
  });

  it("não deixa grupo vazio", () => {
    const vazios = GRUPOS_DE_TOKENS.filter((g) => !g.tokens.length).map(
      (g) => g.titulo,
    );

    expect(vazios).toEqual([]);
  });
});
