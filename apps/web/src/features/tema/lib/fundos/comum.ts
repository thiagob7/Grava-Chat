/* Peças que todo motor de fundo usa. Nada aqui desenha por conta própria. */

export const between = (a: number, b: number) => a + Math.random() * (b - a);

export const pick = <T>(list: readonly T[]): T =>
  list[Math.floor(Math.random() * list.length)]!;

export const tinta = (color: readonly number[], alfa: number) =>
  `rgb(${color[0]} ${color[1]} ${color[2]} / ${alfa})`;

/*
  Ruído de valor: uma curva suave e repetível a partir de um número. Serve
  para duna, onda e chama, onde `Math.random()` a cada quadro daria tremida
  em vez de movimento.
*/
export function ripple(x: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const suave = f * f * (3 - 2 * f);
  const um = Math.sin(i * 127.1) * 43758.5453;
  const two = Math.sin((i + 1) * 127.1) * 43758.5453;

  return (um - Math.floor(um)) * (1 - suave) + (two - Math.floor(two)) * suave;
}

/*
  A cor de acento do tema, lida do próprio CSS. É o que faz o mesmo motor
  servir a temas diferentes sem virar um efeito genérico colado por cima.
*/
export function themeColor(name: string, reserve: number[]): number[] {
  if (typeof document === "undefined") return reserve;

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();

  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value);

  if (hex?.[1]) {
    const d = hex[1].length === 3 ? hex[1].split("").map((c) => c + c) : hex[1].match(/../g)!;
    return d.map((p) => parseInt(p, 16));
  }

  const rgb = value.match(/\d+(\.\d+)?/g);
  return rgb && rgb.length >= 3 ? rgb.slice(0, 3).map(Number) : reserve;
}
