/*
  Lista as variáveis que o app REALMENTE lê.

  O catálogo do estúdio era escrito à mão, com um campo `ligado` que alguém
  marcava. Ele envelheceu nos dois sentidos: oferecia 511 tokens, dos quais 450
  não faziam nada, e escondia 26 que mandavam na tela. Quem abria a aba Tokens
  mexia em campo morto e não achava o vivo.

  A verdade está no CSS construído, não numa lista. Este script lê o `dist` e
  pergunta: que variável alguma regra de componente ou de utilidade consome?

  A distinção que importa: `:root` é onde a camada de tokens define uma variável
  em função de outra. Contar isso como uso faria a camada declarar-se viva
  sozinha — foi exatamente o vazamento da trava antiga, que dava `--color-*`
  como lido só porque o nome aparecia na própria declaração.

  Rodar:
    node scripts/tokens-vivos.mjs           escreve o JSON
    node scripts/tokens-vivos.mjs --check   falha se o JSON estiver velho

  Precisa de `yarn build` antes: sem o `dist` não há o que ler.
*/
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

/*
  Maquinário, não vocabulário. `--tw-*` é o encanamento interno do Tailwind e
  `--radix-*` é o do Radix: mexer neles não pinta nada, quebra. As escalas que o
  Tailwind declara sozinho ficam de fora pelo mesmo motivo — quem manda no
  espaçamento é a classe, não o tema.
*/
const MAQUINARIO =
  /^--(tw|radix|default|animate|ease|aspect|blur|perspective|breakpoint|container|leading|tracking|spacing|inset|drop)-|^--(tw|s|y|g|spacing)$/;

/// Variáveis que a gente escreve em tempo de execução, não que o tema define.
const DE_RUNTIME = /^--gc-/;

/*
  Vocabulário de biblioteca de terceiro. O react-toastify tem 35 variáveis
  próprias; listá-las no estúdio seria despejar o dicionário dos outros na cara
  de quem quer trocar uma cor. Em vez disso, o nosso CSS aponta as delas para as
  nossas — assim o aviso segue o tema sem virar campo de formulário.
*/
const DE_BIBLIOTECA = /^--toastify-/;

/*
  Um token é vocabulário de tema quando duas coisas valem ao mesmo tempo:

  1. alguma regra de componente o CONSOME, e
  2. a raiz o DECLARA.

  A segunda condição é o que separa token de variável de trabalho. `--colunas`
  e `--largura-do-quadro`, por exemplo, nascem dentro de `.grade-de-varios` e
  existem para uma conta de grade — mexer nelas pelo estúdio não seria tema,
  seria quebrar a conta.
*/
/*
  A raiz reconhecida pela FORMA, não pelo prefixo. O Tailwind emite o @theme em
  `:root,:host`, e o `:host` sozinho também aparece; já `:root ::-webkit-scrollbar-thumb`
  começa com `:root` mas é regra de componente — mede o rolador, não declara token.
  Vale como declaração quando toda parte da lista é a raiz e nada mais: sem
  espaço, sem `>`, sem `+`, sem `~`.
*/
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
