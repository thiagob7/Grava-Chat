import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import Color from "color";

const AQUI = dirname(fileURLToPath(import.meta.url));
const CSS = join(AQUI, "..", "src", "styles", "index.css");
const LISTA = join(
  AQUI,
  "..",
  "src",
  "features",
  "configuracoes",
  "lib",
  "cores-mae.json",
);

function corDaReserva(valor) {
  let v = valor.trim();

  while (v.startsWith("var(")) {
    const virgula = v.indexOf(",");
    if (virgula < 0) return v;
    v = v.slice(virgula + 1, v.lastIndexOf(")")).trim();
  }

  return v;
}

const FAMILIAS = {
  fundo: {
    rotulo: "Fundo",
    dica: "as superfícies, as bordas, o hover e o palco de voz",
    mae: "--color-surface-0",
    espelha: true,
    filhas: [
      "--color-surface-1",
      "--color-surface-2",
      "--color-surface-3",
      "--color-surface-4",
      "--color-campo",
      "--color-campo-foco",
      "--color-composer",
      "--color-cabecalho",
      "--color-painel",
      "--color-codigo",
      "--color-codigo-bloco",
      "--color-hover",
      "--color-selecionado",
      "--color-divisor",
      "--color-line",
      "--color-line-sutil",
      "--color-palco",
      "--color-trilho",
      { nome: "--color-veu", ancora: true },
      { nome: "--color-sombra", ancora: true },
      { nome: "--color-brilho", ancora: true },
      { nome: "--color-sobre-midia", ancora: true },
    ],
  },
  texto: {
    rotulo: "Texto",
    dica: "o texto forte, o apagado e o do palco",
    mae: "--color-ink",
    espelha: true,
    filhas: ["--color-ink-muted", "--color-ink-faint", "--color-pilula", "--color-palco-ink"],
  },
  marca: {
    rotulo: "Marca",
    dica: "botão, link, menção, resposta e o anel de foco",
    mae: "--color-brand",
    espelha: false,
    filhas: [
      "--color-brand-hover",
      "--color-foco-anel",
      "--color-link",
      "--color-mencao",
      "--color-resposta",
      "--color-everyone",
      { nome: "--color-sobre-marca", contraste: true },
    ],
  },
  perigo: {
    rotulo: "Perigo e aviso",
    dica: "apagar, não perturbe, aviso e destaque",
    mae: "--color-danger",
    espelha: false,
    filhas: [
      "--color-danger-fundo",
      "--color-dnd",
      "--color-aviso",
      "--color-destaque",
      "--color-destaque-fundo",
      "--color-here",
    ],
  },
};

function coresDoTema(css) {
  const inicio = css.indexOf("@theme {");
  if (inicio < 0) throw new Error("não achei o bloco @theme");

  const corpo = css.slice(inicio, css.indexOf("\n}", inicio));
  const cores = {};

  for (const [, nome, valor] of corpo.matchAll(
    /^\s+(--color-[\w-]+):\s*([^;]+);/gm,
  )) {
    cores[nome] = corDaReserva(valor);
  }

  return cores;
}

const arredonda = (n) => Number(n.toFixed(4));

export function extrairCoresMae(css) {
  const cores = coresDoTema(css);
  const saida = {};

  for (const [id, familia] of Object.entries(FAMILIAS)) {
    const bruta = cores[familia.mae];
    if (!bruta) throw new Error(`o @theme não declara ${familia.mae}`);

    const mae = Color(bruta);
    const [maeL = 0, maeC = 0, maeH = 0] = mae.lch().array();

    const filhas = (familia.filhas ?? []).map((entrada) => {
      const { nome, ...extras } =
        typeof entrada === "string" ? { nome: entrada } : entrada;

      const valor = cores[nome];
      if (!valor) throw new Error(`o @theme não declara ${nome}`);

      const filha = Color(valor);
      const [L = 0, C = 0, H = 0] = filha.lch().array();

      return {
        nome,
        dL: arredonda(L - maeL),
        razaoC: arredonda(C / Math.max(maeC, 3)),
        dH: arredonda(((H - maeH) % 360 + 540) % 360 - 180),
        alfa: filha.alpha() < 1 ? arredonda(filha.alpha()) : null,
        ...(extras.contraste || extras.ancora ? { L: arredonda(L) } : {}),
        espelha: familia.espelha,
        ...extras,
      };
    });

    saida[id] = {
      rotulo: familia.rotulo,
      dica: familia.dica,
      mae: familia.mae,
      padrao: mae.alpha() < 1 ? bruta : mae.hex().toLowerCase(),
      filhas,
    };
  }

  return saida;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const saida = `${JSON.stringify(extrairCoresMae(readFileSync(CSS, "utf8")), null, 2)}\n`;

  if (process.argv[2] === "--check") {
    const atual = existsSync(LISTA) ? readFileSync(LISTA, "utf8") : "";

    if (atual !== saida) {
      console.error("\ncores-mae.json está fora de dia. Rode: yarn tokens\n");
      process.exit(1);
    }

    console.log("cores-mãe em dia");
  } else {
    writeFileSync(LISTA, saida);
    console.log(`cores-mãe em ${relative(AQUI, LISTA)}`);
  }
}
