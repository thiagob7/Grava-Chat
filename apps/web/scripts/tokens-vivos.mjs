import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const DIST = join(AQUI, "..", "dist", "assets");
const LISTA = join(
  AQUI,
  "..",
  "src",
  "features",
  "configuracoes",
  "lib",
  "tokens-vivos.json",
);

const MAQUINARIO =
  /^--(tw|radix|default|animate|ease|aspect|blur|perspective|breakpoint|container|leading|tracking|spacing|inset|drop)-|^--(tw|s|y|g|spacing)$/;

const DE_RUNTIME = /^--gc-/;

const DE_BIBLIOTECA = /^--toastify-/;

const RAIZ = /^(:root|:host|html)(\[[^\]]*\]|[.:][^\s>+~,]+)*$/;

function ehRaiz(seletor) {
  return seletor.split(",").every((parte) => RAIZ.test(parte.trim()));
}

export function extrairVivos(css) {
  const declaradosNaRaiz = new Set();
  const consumidos = new Set();

  for (const [, seletor, corpo] of css.matchAll(/([^{}@]*)\{([^{}]*)\}/g)) {
    const alvo = seletor.trim();
    if (!alvo) continue;

    if (ehRaiz(alvo)) {
      for (const [, nome] of corpo.matchAll(/(--[a-z0-9-]+)\s*:/g)) {
        declaradosNaRaiz.add(nome);
      }
      continue;
    }

    if (alvo.startsWith("*")) continue;

    for (const [, nome] of corpo.matchAll(/var\((--[a-z0-9-]+)/g)) {
      consumidos.add(nome);
    }
  }

  return [...consumidos]
    .filter((nome) => declaradosNaRaiz.has(nome))
    .filter((nome) => !MAQUINARIO.test(nome) && !DE_RUNTIME.test(nome))
    .filter((nome) => !DE_BIBLIOTECA.test(nome))
    .filter((nome) => !nome.endsWith("--line-height"))
    .sort();
}

function cssDoBuild() {
  if (!existsSync(DIST)) {
    throw new Error(
      `não achei ${relative(process.cwd(), DIST)} — rode \`yarn build\` antes`,
    );
  }

  const folhas = readdirSync(DIST).filter((nome) => nome.endsWith(".css"));

  if (!folhas.length) throw new Error("o build não tem folha de estilo");

  return folhas.map((nome) => readFileSync(join(DIST, nome), "utf8")).join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const vivos = extrairVivos(cssDoBuild());
  const saida = `${JSON.stringify(vivos, null, 2)}\n`;

  if (process.argv[2] === "--check") {
    const atual = existsSync(LISTA) ? readFileSync(LISTA, "utf8") : "";

    if (atual !== saida) {
      console.error(
        `\ntokens-vivos.json está fora de dia (${vivos.length} vivos no build). Rode: yarn tokens\n`,
      );
      process.exit(1);
    }

    console.log(`tokens vivos em dia — ${vivos.length}`);
  } else {
    writeFileSync(LISTA, saida);
    console.log(`${vivos.length} tokens vivos · lista em ${relative(AQUI, LISTA)}`);
  }
}
