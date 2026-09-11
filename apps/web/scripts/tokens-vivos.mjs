import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = join(HERE, "..", "dist", "assets");
const LIST = join(
  HERE,
  "..",
  "src",
  "features",
  "configuracoes",
  "lib",
  "tokens-vivos.json",
);

const MACHINERY =
  /^--(tw|radix|default|animate|ease|aspect|blur|perspective|breakpoint|container|leading|tracking|spacing|inset|drop)-|^--(tw|s|y|g|spacing)$/;

const FROM_RUNTIME = /^--gc-/;

const FROM_LIBRARY = /^--toastify-/;

const ROOT = /^(:root|:host|html)(\[[^\]]*\]|[.:][^\s>+~,]+)*$/;

function isRoot(picker) {
  return picker.split(",").every((part) => ROOT.test(part.trim()));
}

export function extractLive(css) {
  const declaredRoot = new Set();
  const consumed = new Set();

  for (const [, picker, body] of css.matchAll(/([^{}@]*)\{([^{}]*)\}/g)) {
    const target = picker.trim();
    if (!target) continue;

    if (isRoot(target)) {
      for (const [, name] of body.matchAll(/(--[a-z0-9-]+)\s*:/g)) {
        declaredRoot.add(name);
      }
      continue;
    }

    if (target.startsWith("*")) continue;

    for (const [, name] of body.matchAll(/var\((--[a-z0-9-]+)/g)) {
      consumed.add(name);
    }
  }

  return [...consumed]
    .filter((name) => declaredRoot.has(name))
    .filter((name) => !MACHINERY.test(name) && !FROM_RUNTIME.test(name))
    .filter((name) => !FROM_LIBRARY.test(name))
    .filter((name) => !name.endsWith("--line-height"))
    .sort();
}

function cssDoBuild() {
  if (!existsSync(DIST)) {
    throw new Error(
      `não achei ${relative(process.cwd(), DIST)} — rode \`yarn build\` antes`,
    );
  }

  const leaves = readdirSync(DIST).filter((name) => name.endsWith(".css"));

  if (!leaves.length) throw new Error("o build não tem folha de estilo");

  return leaves.map((name) => readFileSync(join(DIST, name), "utf8")).join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const live = extractLive(cssDoBuild());
  const output = `${JSON.stringify(live, null, 2)}\n`;

  if (process.argv[2] === "--check") {
    const current = existsSync(LIST) ? readFileSync(LIST, "utf8") : "";

    if (current !== output) {
      console.error(
        `\ntokens-vivos.json está fora de dia (${live.length} vivos no build). Rode: yarn tokens\n`,
      );
      process.exit(1);
    }

    console.log(`tokens vivos em dia — ${live.length}`);
  } else {
    writeFileSync(LIST, output);
    console.log(`${live.length} tokens vivos · lista em ${relative(HERE, LIST)}`);
  }
}
