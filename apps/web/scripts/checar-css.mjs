import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";

const AQUI = dirname(fileURLToPath(import.meta.url));
const ENTRADA = join(AQUI, "..", "src", "styles", "index.css");

try {
  const css = await readFile(ENTRADA, "utf8");
  const { css: saida } = await postcss([tailwind()]).process(css, { from: ENTRADA });

  console.log(`css: ok — ${saida.split("\n").length} linhas geradas`);
} catch (erro) {
  console.error(`\n  O CSS não compila:\n\n  ${erro.message}\n`);

  if (typeof erro.showSourceCode === "function") console.error(erro.showSourceCode(false));

  process.exit(1);
}
