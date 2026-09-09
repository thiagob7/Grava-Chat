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

function declarado(corpo, nome) {
  return new RegExp(`^\\s+${nome}:\\s*([^;]+);`, "m").exec(corpo)?.[1]?.trim() ?? null;
}

function corDe(corpo, nome, cadeia) {
  const laco = cadeia?.[nome];

  for (const macaneta of laco?.nomes ?? []) {
    const achado = declarado(corpo, macaneta);
    if (achado) return achado;
  }

  const nosso = declarado(corpo, nome);

  return (nosso?.startsWith("var(") ? null : nosso) ?? laco?.reserva ?? null;
}

function cadeiaDoTema(css) {
  const corpo = bloco(css, "@theme {");
  const mapa = {};

  for (const [, nome, valor] of corpo.matchAll(/(--color-[\w-]+):\s*([^;]+);/g)) {
    const nomes = [...valor.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]);
    let reserva = valor.trim();

    while (reserva.startsWith("var(")) {
      const virgula = reserva.indexOf(",");
      if (virgula < 0) break;
      reserva = reserva.slice(virgula + 1, reserva.lastIndexOf(")")).trim();
    }

    mapa[nome] = { nomes, reserva };
  }

  return mapa;
}

export function extrairAmostras(css) {
  const porTema = {};
  const cadeia = cadeiaDoTema(css);

  for (const [tema, abertura] of Object.entries(ONDE)) {
    const corpo = bloco(css, abertura);
    const cor = (nome) => {
      const achado = corDe(corpo, nome, cadeia);
      if (!achado) throw new Error(`não achei ${nome} em \`${abertura}\``);
      return achado;
    };

    porTema[tema] = {
      amostra: [cor("--color-surface-0"), cor("--color-surface-1"), cor("--color-surface-2")],
      acento: cor("--color-brand"),
    };
  }

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
