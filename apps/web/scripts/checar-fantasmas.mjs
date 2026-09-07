/*
  Procura o carimbo que pousa onde não devia.

  Um tema da comunidade mira painel por pedaço de nome, não pelo nome inteiro:
  o Galaxy escreve `[class*="ChannelChatLayout"][class*="container"]` para pegar
  a coluna da conversa, porque na referência só ela tem `container` no nome.

  Na referência isso é seguro: lá cada elemento só carrega as classes do módulo
  dele. Aqui cada elemento carrega também um punhado de classes do Tailwind, e
  basta uma delas ter a palavra dentro para o seletor pousar num vizinho. Foi o
  que aconteceu com a caixa de escrever: ela tinha a classe `@container` do
  Tailwind, o seletor da coluna da conversa a pegou junto, e ela levou um
  `padding: 19px` que não era dela — 20px mais alta que a da referência.

  A regra: num elemento carimbado com `Arquivo.module__parte_gc`, nenhuma outra
  classe pode conter uma `parte` que exista nesse mesmo `Arquivo`. Só o par
  arquivo+parte importa, porque é o que um autor de tema tem como escrever.

  Rodar:
    node scripts/checar-fantasmas.mjs
*/
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, "..", "src");
const PONTE = join(RAIZ, "lib", "compat-de-tema.ts");
const PASTAS_FORA = new Set(["traducao", "assets", "node_modules"]);

/// nome do lugar -> classes que ele carimba
const LUGARES = {};
{
  const fonte = readFileSync(PONTE, "utf8");
  const re = /(\w+):\s*\{\s*(?:flx:\s*"[^"]*",\s*)?classes:\s*\[([^\]]*)\]/g;
  let m;
  while ((m = re.exec(fonte))) {
    LUGARES[m[1]] = [...m[2].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
  }
}

/// Arquivo da referência -> partes que a ponte usa dele
const PARTES = {};
for (const classes of Object.values(LUGARES)) {
  for (const classe of classes) {
    const m = /^([A-Za-z0-9]+)\.module__([A-Za-z0-9]+)_/.exec(classe);
    if (m) (PARTES[m[1]] ??= new Set()).add(m[2]);
  }
}

function arquivos(pasta, achados = []) {
  for (const item of readdirSync(pasta)) {
    if (PASTAS_FORA.has(item)) continue;
    const caminho = join(pasta, item);
    if (statSync(caminho).isDirectory()) arquivos(caminho, achados);
    else if (extname(caminho) === ".tsx") achados.push(caminho);
  }
  return achados;
}

/*
  Só o que vira `class` de verdade: o `className` e o segundo argumento do
  `flx()`. O `data-gc` tem palavra parecida e não pinta nada.
*/
function classesDoElemento(no, fonte) {
  const nomes = [];
  const literais = [];

  const colher = (alvo, dentroDeClasse) => {
    if (ts.isCallExpression(alvo)) {
      const chamada = alvo.expression.getText(fonte);

      if (chamada === "flx" || chamada === "flxCls") {
        const primeiro = alvo.arguments[0];
        if (primeiro && ts.isStringLiteral(primeiro)) nomes.push(primeiro.text);

        const resto = chamada === "flx" ? alvo.arguments.slice(1) : [];
        for (const arg of resto) colher(arg, true);
        return;
      }

      for (const arg of alvo.arguments) colher(arg, dentroDeClasse);
      return;
    }

    if (dentroDeClasse && ts.isStringLiteral(alvo)) {
      literais.push(alvo.text);
      return;
    }

    ts.forEachChild(alvo, (filho) => colher(filho, dentroDeClasse));
  };

  for (const atributo of no.attributes.properties) {
    if (ts.isJsxSpreadAttribute(atributo)) {
      colher(atributo.expression, false);
      continue;
    }

    const nome = atributo.name?.getText(fonte);
    const valor = atributo.initializer;
    if (!valor) continue;

    if (nome === "className") {
      if (ts.isStringLiteral(valor)) literais.push(valor.text);
      else if (ts.isJsxExpression(valor) && valor.expression) colher(valor.expression, true);
    }
  }

  return {
    nomes,
    utilitarias: literais.flatMap((t) => t.split(/\s+/)).filter(Boolean),
  };
}

const achados = [];

for (const caminho of arquivos(RAIZ)) {
  const texto = readFileSync(caminho, "utf8");
  const fonte = ts.createSourceFile(caminho, texto, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  const visitar = (no) => {
    if (ts.isJsxOpeningElement(no) || ts.isJsxSelfClosingElement(no)) {
      const { nomes, utilitarias } = classesDoElemento(no, fonte);
      const carimbos = nomes.flatMap((n) => LUGARES[n] ?? []);

      if (carimbos.length) {
        const meusArquivos = new Set(
          carimbos.map((c) => /^([A-Za-z0-9]+)\.module__/.exec(c)?.[1]).filter(Boolean),
        );

        for (const arquivo of meusArquivos) {
          for (const parte of PARTES[arquivo] ?? []) {
            /// O elemento é o alvo legítimo desse par: pousar aqui é o certo.
            if (carimbos.some((c) => c.startsWith(`${arquivo}.module__${parte}_`))) continue;

            for (const util of utilitarias) {
              if (!util.includes(parte) || carimbos.includes(util)) continue;

              const { line } = fonte.getLineAndCharacterOfPosition(no.getStart(fonte));

              achados.push(
                `${relative(RAIZ, caminho)}:${line + 1} — ${nomes[0]}\n` +
                  `    a classe "${util}" tem "${parte}" dentro, então ` +
                  `[class*="${arquivo}"][class*="${parte}"] pousa aqui sem querer`,
              );
            }
          }
        }
      }
    }

    ts.forEachChild(no, visitar);
  };

  visitar(fonte);
}

if (achados.length) {
  console.error(`${achados.length} carimbo(s) pousando errado:\n`);
  for (const a of achados) console.error(`  ${a}\n`);
  console.error("Troque a classe do Tailwind por uma sem a palavra dentro.\n");
  process.exit(1);
}

console.log(`sem fantasmas — ${Object.keys(PARTES).length} arquivos da referência conferidos`);
