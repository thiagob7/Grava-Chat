/* Peças que todo motor de fundo usa. Nada aqui desenha por conta própria. */

export const entre = (a: number, b: number) => a + Math.random() * (b - a);

export const escolher = <T>(lista: readonly T[]): T =>
  lista[Math.floor(Math.random() * lista.length)]!;

export const tinta = (cor: readonly number[], alfa: number) =>
  `rgb(${cor[0]} ${cor[1]} ${cor[2]} / ${alfa})`;

/*
  Ruído de valor: uma curva suave e repetível a partir de um número. Serve
  para duna, onda e chama, onde `Math.random()` a cada quadro daria tremida
  em vez de movimento.
*/
export function ondular(x: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const suave = f * f * (3 - 2 * f);
  const um = Math.sin(i * 127.1) * 43758.5453;
  const dois = Math.sin((i + 1) * 127.1) * 43758.5453;

  return (um - Math.floor(um)) * (1 - suave) + (dois - Math.floor(dois)) * suave;
}

/*
  A cor de acento do tema, lida do próprio CSS. É o que faz o mesmo motor
  servir a temas diferentes sem virar um efeito genérico colado por cima.
*/
export function corDoTema(nome: string, reserva: number[]): number[] {
  if (typeof document === "undefined") return reserva;

  const valor = getComputedStyle(document.documentElement)
    .getPropertyValue(nome)
    .trim();

  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(valor);

  if (hex?.[1]) {
    const d = hex[1].length === 3 ? hex[1].split("").map((c) => c + c) : hex[1].match(/../g)!;
    return d.map((p) => parseInt(p, 16));
  }

  const rgb = valor.match(/\d+(\.\d+)?/g);
  return rgb && rgb.length >= 3 ? rgb.slice(0, 3).map(Number) : reserva;
}
