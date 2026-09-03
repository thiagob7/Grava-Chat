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
  /*
    Cor, tamanho de fonte e peso. Os três são escolha de tema — e os dois
    últimos entraram depois, junto com a escala: sem eles aqui, criar um degrau
    novo no `@theme` não faria o estúdio nem piscar.

    O `--text-N--line-height` fica de fora: é o par do tamanho, não um token
    separado, e oferecê-lo na tela seria pedir pra alguém desalinhar a linha
    do texto sem entender por quê.
  */
  return [...corpo.matchAll(/^\s+(--(?:color|text|font-weight)-[\w-]+):/gm)]
    .map((m) => m[1])
    .filter((nome): nome is string => Boolean(nome))
    .filter((nome) => !nome.includes("--line-height"));
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

/*
  Tokens que o Tailwind lê por nós.

  `shadow-lg` e `rounded-md` são utilidades que leem `var(--shadow-lg)` e
  `var(--radius-md)` — o `var()` está dentro do Tailwind, e nunca vai aparecer
  no nosso código. Sem esta lista eles seriam marcados como não ligados, o que
  é falso: mexer neles muda a tela em cada um dos lugares que usa a classe.
*/
const PELO_TAILWIND: Record<string, RegExp> = {
  "--font-sans": /\bfont-sans\b/,
  "--font-mono": /\bfont-mono\b/,
  "--shadow-sm": /\bshadow-sm\b/,
  "--shadow-md": /\bshadow-md\b/,
  "--shadow-lg": /\bshadow-lg\b/,
  "--shadow-xl": /\bshadow-xl\b/,
  "--radius-sm": /\brounded-sm\b/,
  "--radius-md": /\brounded-md\b/,
  "--radius-lg": /\brounded-lg\b/,
  "--radius-xl": /\brounded-xl\b/,
  "--radius-2xl": /\brounded-2xl\b/,
  "--radius-full": /\brounded-full\b/,
};

/*
  Quem, dentro da própria camada, lê quem.

  `--font-sans` termina em `var(--font-fallback-sans)`, e a cauda nunca vai
  aparecer no código do app — ela é lida pela fonte principal, que é lida pelo
  Tailwind. Sem enxergar esse caminho, o teste chamaria de "não ligado" um
  token que muda a tela de verdade.
*/
function referenciasDaCamada(): Record<string, string[]> {
  const mapa: Record<string, string[]> = {};

  for (const [, dono, valor] of camada.matchAll(/^\s+(--[\w-]+):([^;]*);/gm)) {
    for (const [, lido] of (valor ?? "").matchAll(/var\((--[\w-]+)/g)) {
      if (!lido || !dono) continue;
      (mapa[lido] ??= []).push(dono);
    }
  }

  return mapa;
}

function ehLido(
  nome: string,
  codigo: string,
  vistos = new Set<string>(),
): boolean {
  /// Ciclo entre tokens não é erro (um pode cair no outro por `var(x, y)`),
  /// mas percorrê-lo duas vezes é laço infinito.
  if (vistos.has(nome)) return false;
  vistos.add(nome);

  const pelaUtilidade = PELO_TAILWIND[nome];
  if (pelaUtilidade?.test(codigo)) return true;

  /// Os `--color-*` viram utilidade com o nome no meio (`bg-surface-2`), então
  /// procurar pelo token inteiro basta: ele aparece no `@theme` e nos temas.
  if (nome.startsWith("--color-") && codigo.includes(nome)) return true;

  /*
    A escala e os pesos viram utilidade com o número no nome: `--text-13` é a
    classe `text-13`, `--font-weight-semibold` é `font-semibold`. Procurar pela
    classe é a única prova de que o degrau tem uso — um degrau declarado que
    ninguém aplica é peso morto na escala, e a escala só serve enxuta.
  */
  const utilidade = nome
    .replace(/^--text-/, "text-")
    .replace(/^--font-weight-/, "font-");
  if (utilidade !== nome && new RegExp(`\\b${utilidade}\\b`).test(codigo))
    return true;

  if (codigo.includes(`var(${nome})`)) return true;

  /// Por tabela: alguém na camada lê este token, e esse alguém é lido.
  return (referencias[nome] ?? []).some((dono) => ehLido(dono, codigo, vistos));
}

const referencias = referenciasDaCamada();

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
    const mentindo = TODOS_OS_TOKENS.filter((t) => t.ligado).filter(
      (t) => !ehLido(t.nome, codigo),
    );

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
