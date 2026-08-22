/**
 * Piso de contraste.
 *
 * A pessoa escolhe a cor que quiser; a tela garante que dê pra ler. Sem isto,
 * roxo escuro sobre o fundo escuro do app vira um nome invisível — e a culpa
 * parece do app, não da escolha.
 *
 * Vale também para a **cor de cargo**, que hoje é aplicada crua e já pode ficar
 * ilegível num servidor onde alguém escolheu um tom fechado.
 */

/** WCAG 2.1 — 3:1 é o mínimo para texto grande e para elementos de interface. */
const MINIMO = 3;

/** O fundo mais escuro do tema; é contra ele que o pior caso acontece. */
const FUNDO_PADRAO = "#18181b";

function canal(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function paraRgb(hex: string): [number, number, number] {
  const limpo = hex.replace("#", "");
  const cheio = limpo.length === 3 ? [...limpo].map((c) => c + c).join("") : limpo;

  return [
    parseInt(cheio.slice(0, 2), 16),
    parseInt(cheio.slice(2, 4), 16),
    parseInt(cheio.slice(4, 6), 16),
  ];
}

const paraHex = (rgb: number[]) =>
  `#${rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;

/** Luminância relativa, 0 (preto) a 1 (branco). */
export function luminancia(hex: string): number {
  const [r, g, b] = paraRgb(hex);
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

export function contraste(a: string, b: string): number {
  const la = luminancia(a);
  const lb = luminancia(b);

  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Devolve a cor mais próxima da escolhida que passa no piso.
 *
 * Clareia em passos pequenos em vez de pular pro branco: o objetivo é manter a
 * cor que a pessoa quis, só o suficiente pra enxergar. Um roxo escuro vira um
 * roxo mais claro — não vira cinza.
 */
export function legivel(cor: string, fundo: string = FUNDO_PADRAO): string {
  if (!/^#[0-9a-fA-F]{3,6}$/.test(cor)) return cor;
  if (contraste(cor, fundo) >= MINIMO) return cor;

  const rgb = paraRgb(cor);
  // fundo escuro pede clarear; fundo claro pede escurecer
  const alvoClaro = luminancia(fundo) < 0.5;

  for (let passo = 1; passo <= 20; passo++) {
    const fator = passo * 0.05;
    const proximo = rgb.map((v) => (alvoClaro ? v + (255 - v) * fator : v * (1 - fator)));
    const hex = paraHex(proximo);

    if (contraste(hex, fundo) >= MINIMO) return hex;
  }

  // caso patológico (cor no meio da escala contra fundo médio): entrega o que dá
  return alvoClaro ? "#ffffff" : "#000000";
}
