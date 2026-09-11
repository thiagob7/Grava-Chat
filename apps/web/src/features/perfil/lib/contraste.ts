const MIN = 3;

const DEFAULT_BACKGROUND = "#18181b";

function channel(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function forRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? [...clean].map((c) => c + c).join("") : clean;

  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

const forHex = (rgb: number[]) =>
  `#${rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;

export function luminance(hex: string): number {
  const [r, g, b] = forRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);

  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export function readable(color: string, background: string = DEFAULT_BACKGROUND): string {
  if (!/^#[0-9a-fA-F]{3,6}$/.test(color)) return color;
  if (contrast(color, background) >= MIN) return color;

  const rgb = forRgb(color);
  const targetLight = luminance(background) < 0.5;

  for (let step = 1; step <= 20; step++) {
    const factor = step * 0.05;
    const next = rgb.map((v) => (targetLight ? v + (255 - v) * factor : v * (1 - factor)));
    const hex = forHex(next);

    if (contrast(hex, background) >= MIN) return hex;
  }

  return targetLight ? "#ffffff" : "#000000";
}
