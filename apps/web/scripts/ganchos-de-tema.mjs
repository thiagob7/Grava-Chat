import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, "..", "src");
const LISTA = join(AQUI, "..", "src", "features", "configuracoes", "lib", "ganchos.json");

const ATRIBUTO = "data-gc";

const PASTAS_FORA = new Set(["traducao", "assets", "node_modules"]);

const SEM_DOM = new Set([
  "Fragment",
  "React.Fragment",
  "Suspense",
  "StrictMode",
  "BrowserRouter",
  "Routes",
  "Route",
  "Navigate",
  "QueryClientProvider",
  "TooltipProvider",
  "ConfirmProvider",
  "SessionProvider",
  "ErrorBoundary",
  "Helmet",
]);

const FINAIS_SEM_DOM = new Set(["Provider", "Consumer", "Portal", "Trigger", "Close"]);

const SEGMENTOS_GENERICOS = new Set([
  "components",
  "component",
  "hooks",
  "lib",
  "stores",
  "pages",
  "presentation",
  "src",
]);

function kebab(valor) {
  return valor
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function escopoDoArquivo(caminho) {
  const partes = relative(RAIZ, caminho)
    .split(sep)
    .join("/")
    .replace(/\.[jt]sx$/, "")
    .split("/")
    .filter(Boolean);

  const limpo = [];

  partes.forEach((parte, indice) => {
    if (indice === 0 && parte === "features") return;

    const token = kebab(parte);
    if (!token) return;

    if (SEGMENTOS_GENERICOS.has(token) && indice !== partes.length - 1) return;

    limpo.push(token);
  });

  if (limpo.at(-1) === "index" && limpo.length > 1) limpo.pop();

  return limpo.join(".");
}

function nomeDoElemento(no) {
  const tag = no.tagName;

  if (ts.isIdentifier(tag)) return tag.text;
  if (ts.isPropertyAccessExpression(tag)) return `${tag.expression.getText()}.${tag.name.text}`;

  return tag.getText();
}

const ehSemDom = (nome) =>
  SEM_DOM.has(nome) || FINAIS_SEM_DOM.has(nome.split(".").pop() ?? "");

function acaoDoElemento(no) {
  for (const atributo of no.attributes.properties) {
    if (!ts.isJsxAttribute(atributo) || !atributo.name) continue;

    const nome = atributo.name.getText();
    if (!/^on[A-Z]/.test(nome)) continue;

    const valor = atributo.initializer;
    if (!valor || !ts.isJsxExpression(valor) || !valor.expression) continue;

    const alvo = valor.expression;

    if (ts.isIdentifier(alvo)) return kebab(alvo.text);
    if (ts.isPropertyAccessExpression(alvo)) return kebab(alvo.name.text);
  }

  return "";
}

function jaTemGancho(no) {
  return no.attributes.properties.find(
    (a) => ts.isJsxAttribute(a) && a.name?.getText() === ATRIBUTO,
  );
}

function processar(caminho, texto) {
  const fonte = ts.createSourceFile(
    caminho,
    texto,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );

  const escopo = escopoDoArquivo(caminho);
  const edicoes = [];
  const usados = new Map();
  const ganchos = [];

  const visitar = (no) => {
    if (ts.isJsxOpeningElement(no) || ts.isJsxSelfClosingElement(no)) {
      const nome = nomeDoElemento(no);

      if (!ehSemDom(nome)) {
        const acao = acaoDoElemento(no);
        const base = [escopo, kebab(nome), acao].filter(Boolean).join(".");

        const vezes = (usados.get(base) ?? 0) + 1;
        usados.set(base, vezes);

        const valor = vezes === 1 ? base : `${base}--${vezes}`;
        ganchos.push(valor);

        const existente = jaTemGancho(no);

        if (existente) {
          if (existente.initializer && ts.isStringLiteral(existente.initializer)) {
            if (existente.initializer.text !== valor) {
              edicoes.push({
                inicio: existente.initializer.getStart(fonte),
                fim: existente.initializer.getEnd(),
                texto: `"${valor}"`,
              });
            }
          }
        } else {
          const posicao = (no.typeArguments?.end ?? no.tagName.getEnd()) + (no.typeArguments ? 1 : 0);

          edicoes.push({ inicio: posicao, fim: posicao, texto: ` ${ATRIBUTO}="${valor}"` });
        }
      }
    }

    ts.forEachChild(no, visitar);
  };

  visitar(fonte);

  let saida = texto;

  for (const edicao of [...edicoes].sort((a, b) => b.inicio - a.inicio)) {
    saida = saida.slice(0, edicao.inicio) + edicao.texto + saida.slice(edicao.fim);
  }

  if (saida !== texto) {
    const conferencia = ts.createSourceFile(
      caminho,
      saida,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );

    if (conferencia.parseDiagnostics?.length) {
      const erro = conferencia.parseDiagnostics[0];
      const { line } = conferencia.getLineAndCharacterOfPosition(erro.start ?? 0);

      throw new Error(
        `${relative(RAIZ, caminho)}:${line + 1} — o gancho quebraria o arquivo: ` +
          ts.flattenDiagnosticMessageText(erro.messageText, " "),
      );
    }
  }

  return { saida, mudou: saida !== texto, ganchos };
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

const modo = process.argv[2] ?? "";
const conferir = modo === "--check";
const soLista = modo === "--lista";

let mexidos = 0;
const todosOsGanchos = [];

for (const caminho of arquivos(RAIZ)) {
  const texto = readFileSync(caminho, "utf8");
  const { saida, mudou, ganchos } = processar(caminho, texto);

  todosOsGanchos.push(...ganchos);

  if (!mudou) continue;

  mexidos++;

  if (conferir) {
    console.error(`  sem gancho: ${relative(RAIZ, caminho)}`);
  } else if (!soLista) {
    writeFileSync(caminho, saida);
  }
}

if (conferir) {
  if (mexidos) {
    console.error(`\n${mexidos} arquivo(s) fora de dia. Rode: yarn ganchos\n`);
    process.exit(1);
  }

  console.log(`ganchos em dia — ${todosOsGanchos.length} no app`);
} else {
  if (!soLista) console.log(`${mexidos} arquivo(s) atualizados`);

  writeFileSync(LISTA, `${JSON.stringify([...new Set(todosOsGanchos)].sort(), null, 2)}\n`);
  console.log(`${todosOsGanchos.length} ganchos · lista em ${relative(RAIZ, LISTA)}`);
}
