const MINIMO = 3;

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

export function luminancia(hex: string): number {
  const [r, g, b] = paraRgb(hex);
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

export function contraste(a: string, b: string): number {
  const la = luminancia(a);
  const lb = luminancia(b);

  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export function legivel(cor: string, fundo: string = FUNDO_PADRAO): string {
  if (!/^#[0-9a-fA-F]{3,6}$/.test(cor)) return cor;
  if (contraste(cor, fundo) >= MINIMO) return cor;

  const rgb = paraRgb(cor);
  const alvoClaro = luminancia(fundo) < 0.5;

  for (let passo = 1; passo <= 20; passo++) {
    const fator = passo * 0.05;
    const proximo = rgb.map((v) => (alvoClaro ? v + (255 - v) * fator : v * (1 - fator)));
    const hex = paraHex(proximo);

    if (contraste(hex, fundo) >= MINIMO) return hex;
  }

  return alvoClaro ? "#ffffff" : "#000000";
}
