import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const CSS = join(AQUI, "..", "src", "styles", "index.css");
const LISTA = join(
  AQUI,
  "..",
  "src",
  "features",
  "configuracoes",
  "lib",
  "macanetas.json",
);

export function extrairMacanetas(css) {
  const inicio = css.indexOf("@theme {");
  const corpo = css.slice(inicio, css.indexOf("\n}", inicio));
  const porToken = {};

  for (const [, nome, valor] of corpo.matchAll(/(--color-[\w-]+):\s*([^;]+);/g)) {
    const nomes = [...valor.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]);
    if (nomes.length) porToken[nome] = nomes;
  }

  return porToken;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const saida = `${JSON.stringify(extrairMacanetas(readFileSync(CSS, "utf8")), null, 2)}\n`;

  if (process.argv[2] === "--check") {
    const atual = existsSync(LISTA) ? readFileSync(LISTA, "utf8") : "";

    if (atual !== saida) {
      console.error("\nmacanetas.json está fora de dia. Rode: yarn tokens\n");
      process.exit(1);
    }

    const quantos = Object.keys(JSON.parse(saida)).length;
    console.log(`maçanetas em dia — ${quantos} tokens`);
  } else {
    writeFileSync(LISTA, saida);
    console.log(`maçanetas em ${relative(process.cwd(), LISTA)}`);
  }
}
