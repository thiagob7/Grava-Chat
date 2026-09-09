import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, "..", "src");
const PASTAS_FORA = new Set(["traducao", "assets", "node_modules"]);

const LUGARES = {};
{
  const t = readFileSync(join(RAIZ, "lib", "compat-de-tema.ts"), "utf8");
  const re = /(\w+):\s*\{\s*(?:flx:\s*"[^"]*",\s*)?classes:\s*\[([^\]]*)\]/g;
  let m;
  while ((m = re.exec(t))) LUGARES[m[1]] = [...m[2].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
}

const dono = new Map();
for (const [lugar, classes] of Object.entries(LUGARES))
  for (const c of classes) {
    if (!dono.has(c)) dono.set(c, new Set());
    dono.get(c).add(lugar);
  }

const TRAVADO = /\.([A-Za-z][A-Za-z0-9]*)\\\.module__([A-Za-z0-9]+)___[A-Za-z0-9]+/g;

const traduzir = (css) =>
  css
    .replace(TRAVADO, (_, a, p) => `[class*="${a}.module__${p}_"]`)
    .replace(/\bdiv(?=\[class\*=)/g, "");

const arquivos = process.argv.slice(2);

if (!arquivos.length) {
  console.error("uso: node scripts/checar-cadeias.mjs <tema.css> [outro.css …]");
  process.exit(2);
}

const colapsados = new Map();
let cadeias = 0;

for (const arq of arquivos) {
  const css = traduzir(readFileSync(arq, "utf8").replace(/\/\*[\s\S]*?\*\//g, ""));

  for (const bloco of css.split("}")) {
    const i = bloco.indexOf("{");
    if (i < 0) continue;

    for (const sel of bloco.slice(0, i).split(",")) {
      const limpo = sel.trim().replace(/:(?:has|not|is|where)\([^)]*\)/g, "");
      const passos = limpo.split(/\s+(?![^[]*\])/).filter((x) => x.includes("class*="));
      if (passos.length < 2) continue;
      cadeias++;

      const lugares = passos.map((passo) => {
        const pedacos = [...passo.matchAll(/\[class\*="([^"]+)"\]/g)].map((x) => x[1]);
        const achados = new Set();

        for (const p of pedacos)
          for (const [classe, deles] of dono)
            if (classe.includes(p)) for (const l of deles) achados.add(l);

        return achados;
      });

      for (let k = 0; k + 1 < lugares.length; k++) {
        if (!lugares[k].size) continue;
        if ([...lugares[k]].some((a) => !lugares[k + 1].has(a))) continue;

        const nome = (p) => p.replace(/\[class\*="|"\]/g, "");
        const chave = `${nome(passos[k])}  >>  ${nome(passos[k + 1])}`;
        colapsados.set(chave, (colapsados.get(chave) ?? 0) + 1);
      }
    }
  }
}

const regras = [...colapsados.values()].reduce((a, b) => a + b, 0);

console.log(`${cadeias} seletores em cadeia nos temas conferidos`);

if (!colapsados.size) {
  console.log("nenhum nome colapsado — todas as cadeias têm onde pousar");
  process.exit(0);
}

console.error(`\n${colapsados.size} par(es) no mesmo elemento, ${regras} regra(s) sem efeito:\n`);
for (const [par, n] of [...colapsados].sort((a, b) => b[1] - a[1]))
  console.error(`  ${String(n).padStart(3)}x  ${par}`);
console.error(
  "\nCada par pede dois elementos aninhados, como na referência. Quando não valer a\n" +
    "pena separar, deixe o motivo escrito na entrada do compat-de-tema.ts.\n",
);
process.exit(1);
