import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "src");
const FOLDERS_OUTSIDE = new Set(["traducao", "assets", "node_modules"]);

const PLACES = {};
{
  const t = readFileSync(join(ROOT, "lib", "compat-de-tema.ts"), "utf8");
  const re = /(\w+):\s*\{\s*(?:flx:\s*"[^"]*",\s*)?classes:\s*\[([^\]]*)\]/g;
  let m;
  while ((m = re.exec(t))) PLACES[m[1]] = [...m[2].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
}

const owner = new Map();
for (const [place, classes] of Object.entries(PLACES))
  for (const c of classes) {
    if (!owner.has(c)) owner.set(c, new Set());
    owner.get(c).add(place);
  }

const LOCKED = /\.([A-Za-z][A-Za-z0-9]*)\\\.module__([A-Za-z0-9]+)___[A-Za-z0-9]+/g;

const translate = (css) =>
  css
    .replace(LOCKED, (_, a, p) => `[class*="${a}.module__${p}_"]`)
    .replace(/\bdiv(?=\[class\*=)/g, "");

const files = process.argv.slice(2);

if (!files.length) {
  console.error("uso: node scripts/checar-cadeias.mjs <tema.css> [outro.css …]");
  process.exit(2);
}

const collapsed = new Map();
let chains = 0;

for (const file of files) {
  const css = translate(readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, ""));

  for (const block of css.split("}")) {
    const i = block.indexOf("{");
    if (i < 0) continue;

    for (const sel of block.slice(0, i).split(",")) {
      const clean = sel.trim().replace(/:(?:has|not|is|where)\([^)]*\)/g, "");
      const steps = clean.split(/\s+(?![^[]*\])/).filter((x) => x.includes("class*="));
      if (steps.length < 2) continue;
      chains++;

      const places = steps.map((step) => {
        const pieces = [...step.matchAll(/\[class\*="([^"]+)"\]/g)].map((x) => x[1]);
        const matches = new Set();

        for (const p of pieces)
          for (const [cssClass, theirs] of owner)
            if (cssClass.includes(p)) for (const l of theirs) matches.add(l);

        return matches;
      });

      for (let k = 0; k + 1 < places.length; k++) {
        if (!places[k].size) continue;
        if ([...places[k]].some((a) => !places[k + 1].has(a))) continue;

        const name = (p) => p.replace(/\[class\*="|"\]/g, "");
        const key = `${name(steps[k])}  >>  ${name(steps[k + 1])}`;
        collapsed.set(key, (collapsed.get(key) ?? 0) + 1);
      }
    }
  }
}

const rules = [...collapsed.values()].reduce((a, b) => a + b, 0);

console.log(`${chains} seletores em cadeia nos temas conferidos`);

if (!collapsed.size) {
  console.log("nenhum nome colapsado — todas as cadeias têm onde pousar");
  process.exit(0);
}

console.error(`\n${collapsed.size} par(es) no mesmo elemento, ${rules} regra(s) sem efeito:\n`);
for (const [par, n] of [...collapsed].sort((a, b) => b[1] - a[1]))
  console.error(`  ${String(n).padStart(3)}x  ${par}`);
console.error(
  "\nCada par pede dois elementos aninhados, como na referência. Quando não valer a\n" +
    "pena separar, deixe o motivo escrito na entrada do compat-de-tema.ts.\n",
);
process.exit(1);
