import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, "..", "src");
const VOCABULARIO = join(AQUI, "vocabulario-de-temas.json");
const PASTAS_FORA = new Set(["traducao", "assets", "node_modules"]);

function lugaresVivos() {
  const mapa = readFileSync(join(RAIZ, "lib", "compat-de-tema.ts"), "utf8");
  const codigo = [];

  const andar = (pasta) => {
    for (const item of readdirSync(pasta, { withFileTypes: true })) {
      const caminho = join(pasta, item.name);

      if (item.isDirectory()) {
        if (!PASTAS_FORA.has(item.name)) andar(caminho);
      } else if (
        /\.tsx?$/.test(item.name) &&
        !item.name.endsWith(".test.ts") &&
        item.name !== "compat-de-tema.ts"
      ) {
        codigo.push(readFileSync(caminho, "utf8"));
      }
    }
  };

  andar(RAIZ);
  const todoOCodigo = codigo.join("\n");

  const classes = new Set();
  const flx = new Set();
  const dono = new Map();

  for (const achado of mapa.matchAll(/^ {2}(\w+): \{/gm)) {
    const nome = achado[1];
    const inicio = mapa.indexOf("{", achado.index);

    let fundo = 0;
    let fim = inicio;

    for (; fim < mapa.length; fim++) {
      if (mapa[fim] === "{") fundo++;
      else if (mapa[fim] === "}" && --fundo === 0) break;
    }

    const corpo = mapa.slice(inicio, fim + 1);

    const usado = todoOCodigo.includes(`"${nome}"`);

    if (!usado) continue;

    for (const [, classe] of corpo.matchAll(/"([A-Za-z]+\.module__[A-Za-z0-9]+)_gc"/g)) {
      classes.add(classe);
      dono.set(classe, nome);
    }

    const caminho = /flx:\s*"([^"]+)"/.exec(corpo);
    if (caminho) flx.add(caminho[1]);
  }

  return { classes, flx, dono };
}

function cadeiaQuebrada(seletor, dono) {
  for (const parte of seletor.split(",")) {
    const degraus = parte
      .replace(/\\/g, "")
      .split(/\s*[>\s]\s*/)
      .map((d) => [...nomesDoSeletor(d)])
      .filter((nomes) => nomes.length);

    for (let i = 1; i < degraus.length; i++) {
      const antes = degraus[i - 1].map((c) => dono.get(c)).filter(Boolean);
      const agora = degraus[i].map((c) => dono.get(c)).filter(Boolean);

      if (antes.length && agora.length && agora.every((l) => antes.includes(l))) return true;
    }
  }

  return false;
}

const semComentario = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");

function nomesDoSeletor(seletor) {
  const limpo = seletor.replace(/\\/g, "");
  const nomes = new Set(
    [...limpo.matchAll(/([A-Za-z]+\.module__[A-Za-z0-9]+)/g)].map((m) => m[1]),
  );

  for (const [, modulo, local] of limpo.matchAll(
    /\[class\*=["']([A-Za-z]+)["']\]\s*\[class\*=["']([A-Za-z]+)["']\]/g,
  )) {
    nomes.add(`${modulo}.module__${local}`);
  }

  return nomes;
}

export function placar(css, vivos) {
  const perdidas = new Map();
  let total = 0;
  let pousam = 0;

  for (const [, seletor, corpo] of semComentario(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const alvo = seletor.trim();

    if (!alvo || alvo.startsWith("@") || !corpo.includes(":")) continue;

    total++;

    const classes = nomesDoSeletor(alvo);
    const flx = new Set(
      [...alvo.matchAll(/data-flx\s*=\s*["']([^"']+)["']/g)].map((m) => m[1]),
    );

    if (!classes.size && !flx.size) {
      pousam++;
      continue;
    }

    const casa =
      !cadeiaQuebrada(alvo, vivos.dono) &&
      ([...classes].some((c) => vivos.classes.has(c)) ||
        [...flx].some((f) => vivos.flx.has(f)));

    if (casa) {
      pousam++;
      continue;
    }

    for (const nome of [...classes].filter((c) => !vivos.classes.has(c))) {
      perdidas.set(nome, (perdidas.get(nome) ?? 0) + 1);
    }

    for (const nome of [...flx].filter((f) => !vivos.flx.has(f))) {
      perdidas.set(nome, (perdidas.get(nome) ?? 0) + 1);
    }
  }

  return { total, pousam, perdidas };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const detalhe = args.includes("--detalhe");
  const arquivos = args.filter((a) => !a.startsWith("--") && statSync(a).isFile());

  if (!arquivos.length) {
    console.error("uso: node scripts/placar-de-tema.mjs <tema.css> [...]");
    process.exit(1);
  }

  const vivos = lugaresVivos();

  const vocabulario = existsSync(VOCABULARIO)
    ? JSON.parse(readFileSync(VOCABULARIO, "utf8"))
    : { classes: [], flx: [] };
  const doreferência = new Set([...vocabulario.classes, ...vocabulario.flx]);

  const somadas = new Map();
  console.log(
    `\n${"tema".padEnd(34)}${"regras".padStart(8)}${"pousam".padStart(8)}${"".padStart(9)}`,
  );
  console.log("-".repeat(59));

  let totalGeral = 0;
  let pousamGeral = 0;

  for (const caminho of arquivos) {
    const { total, pousam, perdidas } = placar(readFileSync(caminho, "utf8"), vivos);
    totalGeral += total;
    pousamGeral += pousam;

    for (const [nome, n] of perdidas) somadas.set(nome, (somadas.get(nome) ?? 0) + n);

    const pct = total ? Math.round((100 * pousam) / total) : 100;
    console.log(
      `${basename(caminho).slice(0, 33).padEnd(34)}${String(total).padStart(8)}` +
        `${String(pousam).padStart(8)}${`${pct}%`.padStart(9)}`,
    );
  }

  console.log("-".repeat(59));
  const pctGeral = totalGeral ? Math.round((100 * pousamGeral) / totalGeral) : 100;
  console.log(
    `${"TOTAL".padEnd(34)}${String(totalGeral).padStart(8)}` +
      `${String(pousamGeral).padStart(8)}${`${pctGeral}%`.padStart(9)}`,
  );

  const ordenadas = [...somadas].sort((a, b) => b[1] - a[1]);
  const reais = ordenadas.filter(([nome]) => doreferência.has(nome));
  const inventadas = ordenadas.filter(([nome]) => !doreferência.has(nome));

  if (reais.length) {
    console.log("\nnomes que mais custam regra (existem na referência — são trabalho nosso):");
    for (const [nome, n] of reais.slice(0, detalhe ? reais.length : 20)) {
      console.log(`  ${String(n).padStart(3)}  ${nome}`);
    }
  }

  if (inventadas.length) {
    console.log(
      `\n${inventadas.length} nome(s) que o tema mira e NÃO existem na referência` +
        " — erro do tema, não nosso." +
        (detalhe ? "" : " Use --detalhe para ver."),
    );
    if (detalhe) for (const [nome, n] of inventadas) console.log(`  ${String(n).padStart(3)}  ${nome}`);
  }

  console.log();
}
