import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";

const HERE = dirname(fileURLToPath(import.meta.url));
const ENTRY = join(HERE, "..", "src", "styles", "index.css");

try {
  const css = await readFile(ENTRY, "utf8");
  const { css: output } = await postcss([tailwind()]).process(css, { from: ENTRY });

  console.log(`css: ok — ${output.split("\n").length} linhas geradas`);
} catch (error) {
  console.error(`\n  O CSS não compila:\n\n  ${error.message}\n`);

  if (typeof error.showSourceCode === "function") console.error(error.showSourceCode(false));

  process.exit(1);
}
