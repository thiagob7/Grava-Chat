import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "src");
const VOCABULARY = join(HERE, "vocabulario-de-temas.json");
const FOLDERS_OUTSIDE = new Set(["traducao", "assets", "node_modules"]);

function placesLive() {
  const map = readFileSync(join(ROOT, "lib", "compat-de-tema.ts"), "utf8");
  const code = [];

  const walk = (folder) => {
    for (const item of readdirSync(folder, { withFileTypes: true })) {
      const path = join(folder, item.name);

      if (item.isDirectory()) {
        if (!FOLDERS_OUTSIDE.has(item.name)) walk(path);
      } else if (
        /\.tsx?$/.test(item.name) &&
        !item.name.endsWith(".test.ts") &&
        item.name !== "compat-de-tema.ts"
      ) {
        code.push(readFileSync(path, "utf8"));
      }
    }
  };

  walk(ROOT);
  const todoCode = code.join("\n");

  const classes = new Set();
  const flx = new Set();
  const owner = new Map();

  for (const match of map.matchAll(/^ {2}(\w+): \{/gm)) {
    const name = match[1];
    const start = map.indexOf("{", match.index);

    let background = 0;
    let end = start;

    for (; end < map.length; end++) {
      if (map[end] === "{") background++;
      else if (map[end] === "}" && --background === 0) break;
    }

    const body = map.slice(start, end + 1);

    const used = todoCode.includes(`"${name}"`);

    if (!used) continue;

    for (const [, cssClass] of body.matchAll(/"([A-Za-z]+\.module__[A-Za-z0-9]+)_gc"/g)) {
      classes.add(cssClass);
      owner.set(cssClass, name);
    }

    const path = /flx:\s*"([^"]+)"/.exec(body);
    if (path) flx.add(path[1]);
  }

  return { classes, flx, owner };
}

function chainBroken(picker, owner) {
  for (const part of picker.split(",")) {
    const steps = part
      .replace(/\\/g, "")
      .split(/\s*[>\s]\s*/)
      .map((d) => [...pickerNames(d)])
      .filter((names) => names.length);

    for (let i = 1; i < steps.length; i++) {
      const before = steps[i - 1].map((c) => owner.get(c)).filter(Boolean);
      const now = steps[i].map((c) => owner.get(c)).filter(Boolean);

      if (before.length && now.length && now.every((l) => before.includes(l))) return true;
    }
  }

  return false;
}

const withoutComment = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");

function pickerNames(picker) {
  const clean = picker.replace(/\\/g, "");
  const names = new Set(
    [...clean.matchAll(/([A-Za-z]+\.module__[A-Za-z0-9]+)/g)].map((m) => m[1]),
  );

  for (const [, modulo, local] of clean.matchAll(
    /\[class\*=["']([A-Za-z]+)["']\]\s*\[class\*=["']([A-Za-z]+)["']\]/g,
  )) {
    names.add(`${modulo}.module__${local}`);
  }

  return names;
}

export function scoreboard(css, live) {
  const lost = new Map();
  let total = 0;
  let land = 0;

  for (const [, picker, body] of withoutComment(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const target = picker.trim();

    if (!target || target.startsWith("@") || !body.includes(":")) continue;

    total++;

    const classes = pickerNames(target);
    const flx = new Set(
      [...target.matchAll(/data-flx\s*=\s*["']([^"']+)["']/g)].map((m) => m[1]),
    );

    if (!classes.size && !flx.size) {
      land++;
      continue;
    }

    const house =
      !chainBroken(target, live.owner) &&
      ([...classes].some((c) => live.classes.has(c)) ||
        [...flx].some((f) => live.flx.has(f)));

    if (house) {
      land++;
      continue;
    }

    for (const name of [...classes].filter((c) => !live.classes.has(c))) {
      lost.set(name, (lost.get(name) ?? 0) + 1);
    }

    for (const name of [...flx].filter((f) => !live.flx.has(f))) {
      lost.set(name, (lost.get(name) ?? 0) + 1);
    }
  }

  return { total, land, lost };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const detail = args.includes("--detalhe");
  const files = args.filter((a) => !a.startsWith("--") && statSync(a).isFile());

  if (!files.length) {
    console.error("uso: node scripts/placar-de-tema.mjs <tema.css> [...]");
    process.exit(1);
  }

  const live = placesLive();

  const vocabulary = existsSync(VOCABULARY)
    ? JSON.parse(readFileSync(VOCABULARY, "utf8"))
    : { classes: [], flx: [] };
  const fromReference = new Set([...vocabulary.classes, ...vocabulary.flx]);

  const summed = new Map();
  console.log(
    `\n${"tema".padEnd(34)}${"regras".padStart(8)}${"pousam".padStart(8)}${"".padStart(9)}`,
  );
  console.log("-".repeat(59));

  let totalGeneral = 0;
  let landGeneral = 0;

  for (const path of files) {
    const { total, land, lost } = scoreboard(readFileSync(path, "utf8"), live);
    totalGeneral += total;
    landGeneral += land;

    for (const [name, n] of lost) summed.set(name, (summed.get(name) ?? 0) + n);

    const pct = total ? Math.round((100 * land) / total) : 100;
    console.log(
      `${basename(path).slice(0, 33).padEnd(34)}${String(total).padStart(8)}` +
        `${String(land).padStart(8)}${`${pct}%`.padStart(9)}`,
    );
  }

  console.log("-".repeat(59));
  const pctGeneral = totalGeneral ? Math.round((100 * landGeneral) / totalGeneral) : 100;
  console.log(
    `${"TOTAL".padEnd(34)}${String(totalGeneral).padStart(8)}` +
      `${String(landGeneral).padStart(8)}${`${pctGeneral}%`.padStart(9)}`,
  );

  const ordered = [...summed].sort((a, b) => b[1] - a[1]);
  const real = ordered.filter(([name]) => fromReference.has(name));
  const invented = ordered.filter(([name]) => !fromReference.has(name));

  if (real.length) {
    console.log("\nnomes que mais custam regra (existem na referência — são trabalho nosso):");
    for (const [name, n] of real.slice(0, detail ? real.length : 20)) {
      console.log(`  ${String(n).padStart(3)}  ${name}`);
    }
  }

  if (invented.length) {
    console.log(
      `\n${invented.length} nome(s) que o tema mira e NÃO existem na referência` +
        " — erro do tema, não nosso." +
        (detail ? "" : " Use --detalhe para ver."),
    );
    if (detail) for (const [name, n] of invented) console.log(`  ${String(n).padStart(3)}  ${name}`);
  }

  console.log();
}
