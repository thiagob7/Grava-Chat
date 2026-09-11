import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import Color from "color";

const HERE = dirname(fileURLToPath(import.meta.url));
const CSS = join(HERE, "..", "src", "styles", "index.css");
const LIST = join(
  HERE,
  "..",
  "src",
  "features",
  "configuracoes",
  "lib",
  "cores-mae.json",
);

function reserveColor(value) {
  let v = value.trim();

  while (v.startsWith("var(")) {
    const virgula = v.indexOf(",");
    if (virgula < 0) return v;
    v = v.slice(virgula + 1, v.lastIndexOf(")")).trim();
  }

  return v;
}

const FAMILIES = {
  background: {
    label: "Fundo",
    hint: "as superfícies, as bordas, o hover e o palco de voz",
    base: "--color-surface-0",
    mirrors: true,
    children: [
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
      { name: "--color-veu", anchor: true },
      { name: "--color-sombra", anchor: true },
      { name: "--color-brilho", anchor: true },
      { name: "--color-sobre-midia", anchor: true },
    ],
  },
  text: {
    label: "Texto",
    hint: "o texto forte, o apagado e o do palco",
    base: "--color-ink",
    mirrors: true,
    children: ["--color-ink-muted", "--color-ink-faint", "--color-pilula", "--color-palco-ink"],
  },
  brand: {
    label: "Marca",
    hint: "botão, link, menção, resposta e o anel de foco",
    base: "--color-brand",
    mirrors: false,
    children: [
      "--color-brand-hover",
      "--color-foco-anel",
      "--color-link",
      "--color-mencao",
      "--color-resposta",
      "--color-everyone",
      { name: "--color-sobre-marca", contrast: true },
    ],
  },
  danger: {
    label: "Perigo e aviso",
    hint: "apagar, não perturbe, aviso e destaque",
    base: "--color-danger",
    mirrors: false,
    children: [
      "--color-danger-fundo",
      "--color-dnd",
      "--color-aviso",
      "--color-destaque",
      "--color-destaque-fundo",
      "--color-here",
    ],
  },
};

function themeColors(css) {
  const start = css.indexOf("@theme {");
  if (start < 0) throw new Error("não achei o bloco @theme");

  const body = css.slice(start, css.indexOf("\n}", start));
  const colors = {};

  for (const [, name, value] of body.matchAll(
    /^\s+(--color-[\w-]+):\s*([^;]+);/gm,
  )) {
    colors[name] = reserveColor(value);
  }

  return colors;
}

const rounds = (n) => Number(n.toFixed(4));

export function extractColorsBase(css) {
  const colors = themeColors(css);
  const output = {};

  for (const [id, family] of Object.entries(FAMILIES)) {
    const bruta = colors[family.base];
    if (!bruta) throw new Error(`o @theme não declara ${family.base}`);

    const base = Color(bruta);
    const [baseL = 0, baseC = 0, baseH = 0] = base.lch().array();

    const children = (family.children ?? []).map((entry) => {
      const { name, ...extras } =
        typeof entry === "string" ? { name: entry } : entry;

      const value = colors[name];
      if (!value) throw new Error(`o @theme não declara ${name}`);

      const child = Color(value);
      const [L = 0, C = 0, H = 0] = child.lch().array();

      return {
        name,
        dL: rounds(L - baseL),
        reasonC: rounds(C / Math.max(baseC, 3)),
        dH: rounds(((H - baseH) % 360 + 540) % 360 - 180),
        alfa: child.alpha() < 1 ? rounds(child.alpha()) : null,
        ...(extras.contrast || extras.anchor ? { L: rounds(L) } : {}),
        mirrors: family.mirrors,
        ...extras,
      };
    });

    output[id] = {
      label: family.label,
      hint: family.hint,
      base: family.base,
      fallback: base.alpha() < 1 ? bruta : base.hex().toLowerCase(),
      children,
    };
  }

  return output;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const output = `${JSON.stringify(extractColorsBase(readFileSync(CSS, "utf8")), null, 2)}\n`;

  if (process.argv[2] === "--check") {
    const current = existsSync(LIST) ? readFileSync(LIST, "utf8") : "";

    if (current !== output) {
      console.error("\ncores-mae.json está fora de dia. Rode: yarn tokens\n");
      process.exit(1);
    }

    console.log("cores-mãe em dia");
  } else {
    writeFileSync(LIST, output);
    console.log(`cores-mãe em ${relative(HERE, LIST)}`);
  }
}
