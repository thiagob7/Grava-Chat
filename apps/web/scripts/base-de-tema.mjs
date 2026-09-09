import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const VOCABULARIO = join(AQUI, "vocabulario-de-temas.json");
const TOKENS = join(AQUI, "..", "src", "styles", "tokens.css");
const SAIDA = join(AQUI, "..", "src", "styles", "base-de-tema.css");
const EXISTENTES = join(
  AQUI, "..", "src", "features", "configuracoes", "lib", "existe-na-referencia.json",
);

export function montarExistentes(vocabulario) {
  const modulos = [...new Set(vocabulario.classes.map((c) => c.split(".module__")[0]))].sort();
  const areas = [...new Set(vocabulario.flx.map((f) => f.split(".").slice(0, 2).join(".")))].sort();
  return `${JSON.stringify({ modulos, areas })}\n`;
}

export function declaradasNaRaiz(css) {
  const semComentario = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const nomes = new Set();

  for (const [, seletor, corpo] of semComentario.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    if (seletor.trim() !== ":root") continue;
    for (const [, nome] of corpo.matchAll(/(--[a-z0-9-]+)\s*:/g)) nomes.add(nome);
  }

  return nomes;
}

export function montar(variaveis, jaTemos) {
  const faltando = Object.keys(variaveis)
    .filter((nome) => !jaTemos.has(nome))
    .sort();

  const linhas = faltando.map((nome) => `    ${nome}: ${variaveis[nome].valor};`);

  return `/*
  GERADO por scripts/base-de-tema.mjs — não edite à mão.

  Os ${faltando.length} nós do grafo de cores da referência que o tokens.css não declara.
  O porquê da camada, e por que isto não sombreia a cadeia do @theme, está no
  cabeçalho do gerador.
*/
@layer variantes-do-app {
  :root {
${linhas.join("\n")}
  }
}
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!existsSync(VOCABULARIO)) {
    console.error("\nfalta o vocabulario-de-temas.json. Rode: yarn vocabulario\n");
    process.exit(1);
  }

  const vocabulario = JSON.parse(readFileSync(VOCABULARIO, "utf8"));
  const css = montar(vocabulario.variaveis, declaradasNaRaiz(readFileSync(TOKENS, "utf8")));
  const existentes = montarExistentes(vocabulario);

  if (process.argv[2] === "--check") {
    const atual = existsSync(SAIDA) ? readFileSync(SAIDA, "utf8") : "";

    const atualExistentes = existsSync(EXISTENTES) ? readFileSync(EXISTENTES, "utf8") : "";

    if (atual !== css || atualExistentes !== existentes) {
      console.error("\nbase-de-tema.css ou existe-na-referencia.json está fora de dia. Rode: yarn base-de-tema\n");
      process.exit(1);
    }

    const quantos = css.match(/^ {4}--/gm)?.length ?? 0;
    console.log(`base da referência em dia — ${quantos} nós`);
  } else {
    writeFileSync(SAIDA, css);
    writeFileSync(EXISTENTES, existentes);
    const quantos = css.match(/^ {4}--/gm)?.length ?? 0;
    console.log(`${quantos} nós em ${relative(process.cwd(), SAIDA)}`);
  }
}
