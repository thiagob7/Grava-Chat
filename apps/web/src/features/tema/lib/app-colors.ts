export const TINTED_TOKENS = [
  "--color-surface-0",
  "--color-surface-1",
  "--color-surface-2",
  "--color-surface-3",
  "--color-surface-4",
  "--color-composer",
  "--color-cabecalho",
  "--color-painel",
  "--color-campo",
  "--color-campo-foco",
  "--color-selecionado",
  "--color-line",
] as const;

export type TintedToken = (typeof TINTED_TOKENS)[number];

export const MAX_COLORS = 3;
export const DEFAULT_ANGLE = 120;
export const DEFAULT_INTENSITY = 12;

export interface AppColors {
  colors: string[];
  angle: number;
  intensity: number;
}

const clamp = (value: number, least: number, most: number) => Math.min(most, Math.max(least, value));

const toChannels = (hex: string) => {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? [...clean].map((c) => c + c).join("") : clean;

  return [0, 2, 4].map((at) => Number.parseInt(full.slice(at, at + 2), 16));
};

const toHex = (channels: number[]) =>
  `#${channels.map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0")).join("")}`;

export function colorAt(colors: string[], position: number): string {
  const usable = colors.filter(Boolean);
  if (!usable.length) return "#000000";
  if (usable.length === 1) return usable[0]!;

  const place = clamp(position, 0, 1) * (usable.length - 1);
  const first = Math.floor(place);
  const second = Math.min(first + 1, usable.length - 1);
  const weight = place - first;

  const one = toChannels(usable[first]!);
  const two = toChannels(usable[second]!);

  return toHex(one.map((channel, index) => channel + (two[index]! - channel) * weight));
}

export const gradientOf = ({ colors, angle }: AppColors) => {
  const usable = colors.filter(Boolean);
  if (!usable.length) return "none";

  return `linear-gradient(${angle}deg, ${usable.length === 1 ? `${usable[0]}, ${usable[0]}` : usable.join(", ")})`;
};

export function appColorsCss(base: Partial<Record<TintedToken, string>>, picked: AppColors): string {
  const usable = picked.colors.filter(Boolean);
  const strength = clamp(picked.intensity, 0, 100);
  if (!usable.length || strength === 0) return "";

  const tint = colorAt(usable, 0.5);

  const lines = TINTED_TOKENS.flatMap((token) => {
    const original = base[token];
    if (!original) return [];

    return [`  ${token}: color-mix(in srgb, ${tint} ${strength}%, ${original});`];
  });

  return [
    `:root.app-colors {`,
    ...lines,
    `  --app-gradient: ${gradientOf(picked)};`,
    `}`,
    `:root.app-colors body {`,
    `  background-image: ${gradientOf({ ...picked, colors: usable })};`,
    `  background-attachment: fixed;`,
    `}`,
  ].join("\n");
}
