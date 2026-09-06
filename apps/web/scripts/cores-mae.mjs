/*
  As quatro cores-mãe, e a distância de cada filha até a sua mãe.

  Mexer em 41 cores uma a uma não é fazer tema, é preencher formulário. Quem
  quer um tema quer dizer "o fundo é este verde" e ver a tela inteira ir junto:
  superfícies, hover, bordas, campo, painel, palco de voz.

  A referência resolve isso gerando as cores de 17 famílias HSL com sete rampas
  de luminosidade curvadas. A curva existe porque o L do HSL não é perceptual —
  o mesmo passo clareia muito no azul e quase nada no amarelo. Aqui a conta é
  feita em LCh, onde o L já é perceptual, então a rampa reta É a curva deles.

  E as distâncias não são inventadas: saem do `index.css`, medindo o tema base.
  Assim derivar sem mexer em nada devolve exatamente o tema de hoje — a
  derivação começa sendo a identidade, e é isso que a torna conferível.

  Rodar:
    node scripts/cores-mae.mjs           escreve o JSON
    node scripts/cores-mae.mjs --check   falha se o JSON estiver velho
*/
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

/*
  Quem é mãe de quem. Isto é a parte que uma máquina não descobre: que o
  `--color-hover` pertence à família do fundo e o `--color-foco-anel` à da
  marca é significado, não medida. Os números vêm do CSS; a família vem daqui.

  `espelha` diz o que fazer quando a mãe troca de lado — de escuro para claro.
  A borda do tema escuro é um branco a 15%: no claro ela tem que virar um preto
  a 15%, senão some.

  `ancora` é a filha que NÃO é degrau de rampa: o véu do modal, a sombra e o
  brilho do vidro são pretos e brancos absolutos, e seguir a mãe os arruinaria
  — véu claro não escurece nada, e sombra clara não é sombra. Ela guarda o
  matiz da mãe, para tingir de leve, mas mantém a própria luminosidade.
*/
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
      /*
        O texto de cima do botão não é um degrau da rampa: ele é o CONTRASTE da
        mãe. Derivar por distância daria preto sobre marca escura assim que
        alguém escolhesse uma marca clara.
      */
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
    cores[nome] = valor.trim();
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
        /// Quanto mais clara (ou escura) que a mãe, em L perceptual.
        dL: arredonda(L - maeL),
        /*
          A saturação anda em PROPORÇÃO, não em soma: uma mãe cinza gera filhas
          cinzas, uma mãe berrante gera filhas berrantes. O piso evita que uma
          mãe quase neutra faça a razão explodir.
        */
        razaoC: arredonda(C / Math.max(maeC, 3)),
        /// O giro de matiz que a filha mantém em relação à mãe.
        dH: arredonda(((H - maeH) % 360 + 540) % 360 - 180),
        alfa: filha.alpha() < 1 ? arredonda(filha.alpha()) : null,
        /// Âncora e contraste guardam o L absoluto: são polos, não degraus.
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
