/*
  As miniaturas de tema, tiradas do CSS.

  Elas eram três hex escritos à mão por tema — e mentiam. O "Mais escuro"
  prometia três cinzas diferentes quando o tema é `#020203` chapado nas três
  superfícies; o "Modo Gravaê" mostrava as suas na ordem invertida. Quem
  escolhia pelo quadradinho escolhia outra coisa.

  Agora sai daqui, do mesmo `index.css` que pinta o app de verdade. A ordem das
  amostras é a ordem da tela: trilho, lateral, conversa — surface-0, 1 e 2.

  Rodar:
    node scripts/amostras-de-tema.mjs           escreve o JSON
    node scripts/amostras-de-tema.mjs --check   falha se o JSON estiver velho
*/
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const CSS = join(AQUI, "..", "src", "styles", "index.css");
const LISTA = join(
  AQUI,
  "..",
  "src",
  "features",
  "configuracoes",
  "lib",
  "amostras-de-tema.json",
);

/// Cada tema e o seletor que o declara. O escuro é o padrão, mora no @theme.
const ONDE = {
  escuro: "@theme {",
  "mais-escuro": ':root[data-tema="mais-escuro"] {',
  gravae: ':root[data-tema="gravae"] {',
  claro: ':root[data-tema="claro"],',
};

function bloco(css, abertura) {
  const inicio = css.indexOf(abertura);
  if (inicio < 0) throw new Error(`não achei o bloco \`${abertura}\``);

  const chave = css.indexOf("{", inicio);
  const fim = css.indexOf("\n}", chave);
  if (fim < 0) throw new Error(`o bloco \`${abertura}\` não fecha`);

  return css.slice(chave, fim);
}

function corDe(corpo, nome) {
  const achado = new RegExp(`^\\s+${nome}:\\s*([^;]+);`, "m").exec(corpo);
  if (!achado?.[1]) throw new Error(`o bloco não declara ${nome}`);

  return achado[1].trim();
}

export function extrairAmostras(css) {
  const porTema = {};

  for (const [tema, abertura] of Object.entries(ONDE)) {
    const corpo = bloco(css, abertura);

    porTema[tema] = {
      amostra: [
        corDe(corpo, "--color-surface-0"),
        corDe(corpo, "--color-surface-1"),
        corDe(corpo, "--color-surface-2"),
      ],
      acento: corDe(corpo, "--color-brand"),
    };
  }

  /*
    O "Seguir o sistema" não tem cor própria: ele é claro ou escuro conforme a
    hora do dia de quem olha. Então a miniatura mostra as duas caras, uma de
    cada lado, em vez de inventar um terceiro tema.
  */
  porTema.sistema = {
    amostra: [porTema.claro.amostra[2], porTema.escuro.amostra[2]],
    acento: porTema.escuro.acento,
  };

  return porTema;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const saida = `${JSON.stringify(extrairAmostras(readFileSync(CSS, "utf8")), null, 2)}\n`;

  if (process.argv[2] === "--check") {
    const atual = existsSync(LISTA) ? readFileSync(LISTA, "utf8") : "";

    if (atual !== saida) {
      console.error(
        "\namostras-de-tema.json está fora de dia. Rode: yarn tokens\n",
      );
      process.exit(1);
    }

    console.log("amostras de tema em dia");
  } else {
    writeFileSync(LISTA, saida);
    console.log(`amostras em ${relative(AQUI, LISTA)}`);
  }
}
