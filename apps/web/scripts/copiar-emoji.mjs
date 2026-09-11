import { cp, mkdir, readdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DESTINATION = join(HERE, "..", "public", "emoji");

const resolve = createRequire(import.meta.url);
let ORIGIN = "";
try {
  ORIGIN = dirname(resolve.resolve("@twemoji/svg/1f600.svg"));
} catch {
}

async function count(folder) {
  try {
    return (await readdir(folder)).length;
  } catch {
    return 0;
  }
}

const inOrigin = ORIGIN ? await count(ORIGIN) : 0;

if (!inOrigin) {
  console.error(
    "\n  Não achei o @twemoji/svg em node_modules. Rode `yarn install` antes.\n",
  );
  process.exit(1);
}

if ((await count(DESTINATION)) >= inOrigin) {
  console.log(`emoji: ${inOrigin} arquivos já em public/emoji`);
  process.exit(0);
}

await mkdir(DESTINATION, { recursive: true });
await cp(ORIGIN, DESTINATION, { recursive: true });

await writeFile(
  join(DESTINATION, "NOTICE.md"),
  [
    "# Emoji — Twemoji",
    "",
    "Estes SVGs são gráficos do Twemoji (https://github.com/jdecked/twemoji),",
    "licenciados sob CC-BY-4.0. Copyright © Twitter, Inc. e outros colaboradores.",
    "",
    "Atribuição completa e texto da licença: `/licencas/twemoji-NOTICE.md`.",
    "",
    "Pasta gerada por `apps/web/scripts/copiar-emoji.mjs` — não edite à mão.",
    "",
  ].join("\n"),
);

console.log(`emoji: ${inOrigin} arquivos copiados para public/emoji`);
