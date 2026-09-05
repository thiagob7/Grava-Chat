import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { describe, expect, it } from "vitest";

import { GRUPOS_DE_TOKENS, TODOS_OS_TOKENS } from "~/lib/tokens";

const raiz = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(raiz, "..", "styles", "index.css"), "utf8");
const camada = readFileSync(join(raiz, "..", "styles", "tokens.css"), "utf8");

function tokensDoTema(): string[] {
  const bloco = /@theme \{([\s\S]*?)\n\}/.exec(css);
  if (!bloco) throw new Error("não achei o bloco @theme no index.css");

  const corpo = bloco[1] ?? "";

  return [...corpo.matchAll(/^\s+(--(?:color|text|font-weight)-[\w-]+):/gm)]
    .map((m) => m[1])
    .filter((nome): nome is string => Boolean(nome))
    .filter((nome) => !nome.includes("--line-height"));
}

function tokensDaCamada(): string[] {
  const bloco = /:root \{([\s\S]*?)\n\}/.exec(camada);
  if (!bloco) throw new Error("não achei o :root no tokens.css");

  return [...(bloco[1] ?? "").matchAll(/^\s+(--[\w-]+):/gm)]
    .map((m) => m[1])
    .filter((nome): nome is string => Boolean(nome));
}

const IGNORADAS = new Set(["traducao", "assets"]);

const fontes = readdirSync(join(raiz, ".."), { withFileTypes: true })
  .filter((item) => item.isDirectory() && !IGNORADAS.has(item.name))
  .map((item) => join(raiz, "..", item.name));

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
  if (vistos.has(nome)) return false;
  vistos.add(nome);

  const pelaUtilidade = PELO_TAILWIND[nome];
  if (pelaUtilidade?.test(codigo)) return true;

  if (nome.startsWith("--color-") && codigo.includes(nome)) return true;

  const utilidade = nome
    .replace(/^--text-/, "text-")
    .replace(/^--font-weight-/, "font-");
  if (utilidade !== nome && new RegExp(`\\b${utilidade}\\b`).test(codigo))
    return true;

  if (codigo.includes(`var(${nome})`)) return true;

  /*
    A largura das laterais é arrastável, então mora em JavaScript e é medida a
    partir do token em vez de sair de um `var()` no JSX. O nome aparece como
    `token: "--x"` na chamada do useLarguraAjustavel, e isso conta como leitura.
  */
  if (codigo.includes(`token: "${nome}"`)) return true;

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
