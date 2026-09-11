import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const CSS = join(HERE, "..", "src", "styles", "index.css");
const LIST = join(
  HERE,
  "..",
  "src",
  "features",
  "configuracoes",
  "lib",
  "macanetas.json",
);

export function extractKnobs(css) {
  const start = css.indexOf("@theme {");
  const body = css.slice(start, css.indexOf("\n}", start));
  const byToken = {};

  for (const [, name, value] of body.matchAll(/(--color-[\w-]+):\s*([^;]+);/g)) {
    const names = [...value.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]);
    if (names.length) byToken[name] = names;
  }

  return byToken;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const output = `${JSON.stringify(extractKnobs(readFileSync(CSS, "utf8")), null, 2)}\n`;

  if (process.argv[2] === "--check") {
    const current = existsSync(LIST) ? readFileSync(LIST, "utf8") : "";

    if (current !== output) {
      console.error("\nmacanetas.json está fora de dia. Rode: yarn tokens\n");
      process.exit(1);
    }

    const count = Object.keys(JSON.parse(output)).length;
    console.log(`maçanetas em dia — ${count} tokens`);
  } else {
    writeFileSync(LIST, output);
    console.log(`maçanetas em ${relative(process.cwd(), LIST)}`);
  }
}
