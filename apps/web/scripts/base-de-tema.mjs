import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const VOCABULARY = join(HERE, "vocabulario-de-temas.json");
const TOKENS = join(HERE, "..", "src", "styles", "tokens.css");
const OUTPUT = join(HERE, "..", "src", "styles", "base-de-tema.css");
const EXISTING = join(
  HERE, "..", "src", "features", "configuracoes", "lib", "existe-na-referencia.json",
);

export function buildExisting(vocabulary) {
  const modules = [...new Set(vocabulary.classes.map((c) => c.split(".module__")[0]))].sort();
  const areas = [...new Set(vocabulary.flx.map((f) => f.split(".").slice(0, 2).join(".")))].sort();
  return `${JSON.stringify({ modules, areas })}\n`;
}

export function declaredRoot(css) {
  const withoutComment = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const names = new Set();

  for (const [, picker, body] of withoutComment.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    if (picker.trim() !== ":root") continue;
    for (const [, name] of body.matchAll(/(--[a-z0-9-]+)\s*:/g)) names.add(name);
  }

  return names;
}

export function build(variables, alreadyHave) {
  const missing = Object.keys(variables)
    .filter((name) => !alreadyHave.has(name))
    .sort();

  const lines = missing.map((name) => `    ${name}: ${variables[name].value};`);

  return `/*
  GERADO por scripts/base-de-tema.mjs — não edite à mão.

  Os ${missing.length} nós do grafo de cores da referência que o tokens.css não declara.
  O porquê da camada, e por que isto não sombreia a cadeia do @theme, está no
  cabeçalho do gerador.
*/
@layer variantes-do-app {
  :root {
${lines.join("\n")}
  }
}
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!existsSync(VOCABULARY)) {
    console.error("\nfalta o vocabulario-de-temas.json. Rode: yarn vocabulario\n");
    process.exit(1);
  }

  const vocabulary = JSON.parse(readFileSync(VOCABULARY, "utf8"));
  const css = build(vocabulary.variables, declaredRoot(readFileSync(TOKENS, "utf8")));
  const existing = buildExisting(vocabulary);

  if (process.argv[2] === "--check") {
    const current = existsSync(OUTPUT) ? readFileSync(OUTPUT, "utf8") : "";

    const currentExisting = existsSync(EXISTING) ? readFileSync(EXISTING, "utf8") : "";

    if (current !== css || currentExisting !== existing) {
      console.error("\nbase-de-tema.css ou existe-na-referencia.json está fora de dia. Rode: yarn base-de-tema\n");
      process.exit(1);
    }

    const count = css.match(/^ {4}--/gm)?.length ?? 0;
    console.log(`base da referência em dia — ${count} nós`);
  } else {
    writeFileSync(OUTPUT, css);
    writeFileSync(EXISTING, existing);
    const count = css.match(/^ {4}--/gm)?.length ?? 0;
    console.log(`${count} nós em ${relative(process.cwd(), OUTPUT)}`);
  }
}
