import { cp, mkdir, readdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const DESTINO = join(AQUI, "..", "public", "emoji");

const resolver = createRequire(import.meta.url);
let ORIGEM = "";
try {
  ORIGEM = dirname(resolver.resolve("@twemoji/svg/1f600.svg"));
} catch {
}

async function quantos(pasta) {
  try {
    return (await readdir(pasta)).length;
  } catch {
    return 0;
  }
}

const naOrigem = ORIGEM ? await quantos(ORIGEM) : 0;

if (!naOrigem) {
  console.error(
    "\n  Não achei o @twemoji/svg em node_modules. Rode `yarn install` antes.\n",
  );
  process.exit(1);
}

if ((await quantos(DESTINO)) >= naOrigem) {
  console.log(`emoji: ${naOrigem} arquivos já em public/emoji`);
  process.exit(0);
}

await mkdir(DESTINO, { recursive: true });
await cp(ORIGEM, DESTINO, { recursive: true });

await writeFile(
  join(DESTINO, "NOTICE.md"),
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

console.log(`emoji: ${naOrigem} arquivos copiados para public/emoji`);
