/*
  Procura o nome da referência que carimbamos no lugar errado da árvore.

  Um tema não mira nome solto, mira cadeia:

      .Message__messageContent .Markup__markup { … }

  Isso exige que `markup` seja DESCENDENTE de `messageContent`. Se os dois nomes
  moram no mesmo elemento aqui, a regra não casa — nome no mesmo lugar não é
  descendente de si próprio. E o pior: contando nome, os dois estão presentes, e
  parece que está tudo certo.

  Foi assim que 35 regras de um tema da comunidade ficaram meses sem pintar nada: as do
  texto da mensagem, a coisa mais visível da tela. A árvore lá tem quatro
  níveis — `message` > `container` > `messageContent` > `markup` — e a nossa
  tinha dois.

  Rodar contra os temas que você tem em mãos:
    node scripts/checar-cadeias.mjs ~/Downloads/*.css

  Não entra no `yarn check` porque depende de arquivo de tema, que não mora no
  repo. É ferramenta de quando um tema importado não pega.
*/
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

/// classe da referência -> todos os lugares nossos que a carregam
const dono = new Map();
for (const [lugar, classes] of Object.entries(LUGARES))
  for (const c of classes) {
    if (!dono.has(c)) dono.set(c, new Set());
    dono.get(c).add(lugar);
  }

const TRAVADO = /\.([A-Za-z][A-Za-z0-9]*)\\\.module__([A-Za-z0-9]+)___[A-Za-z0-9]+/g;

/// O mesmo que o importador faz: traduz o que o build de quem escreveu datou.
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
      /// O que está dentro de :has()/:not() qualifica o passo, não é um passo.
      const limpo = sel.trim().replace(/:(?:has|not|is|where)\([^)]*\)/g, "");
      const passos = limpo.split(/\s+(?![^[]*\])/).filter((x) => x.includes("class*="));
      if (passos.length < 2) continue;
      cadeias++;

      const lugares = passos.map((passo) => {
        const pedacos = [...passo.matchAll(/\[class\*="([^"]+)"\]/g)].map((x) => x[1]);
        const achados = new Set();

        /// substring, num sentido só — é o que o navegador faz num [class*="…"]
        for (const p of pedacos)
          for (const [classe, deles] of dono)
            if (classe.includes(p)) for (const l of deles) achados.add(l);

        return achados;
      });

      /*
        Só é colapso quando não sobra saída: se algum lugar do passo anterior
        NÃO é também o passo seguinte, existe um ancestral de verdade e a regra
        ainda pode casar.
      */
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
