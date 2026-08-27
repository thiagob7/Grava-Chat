/*
  Geometria compartilhada pelos geradores de decoração em SVG.

  Todas desenham num quadro 200x200 com o anel a 84 de raio — o mesmo do
  `aro.json` e do `gelo.json`. É isso que faz todas ocuparem o mesmo lugar em
  volta do retrato com `folga: "-16%"`.
*/
export const C = 100;
export const R = 84;

export const rad = (g) => (g * Math.PI) / 180;
export const n = (v) => Math.round(v * 100) / 100;
export const em = (g, r = R) => [n(C + r * Math.cos(rad(g))), n(C + r * Math.sin(rad(g)))];

/// Distribui `quantos` itens em volta do círculo, começando em `de`.
export const emVolta = (quantos, de = -90) =>
  Array.from({ length: quantos }, (_, i) => de + (i * 360) / quantos);

/*
  Animação declarativa, e não CSS de fora.

  Um SVG dentro de `<img>` roda em modo animado seguro: SMIL e CSS de dentro do
  arquivo funcionam, script não. Folha de estilo do app não alcança aqui — por
  isso a animação vive dentro do próprio arquivo.
*/
export const gira = (dur, de = 0, ate = 360) =>
  `<animateTransform attributeName="transform" type="rotate" values="${de} ${C} ${C};${ate} ${C} ${C}" dur="${dur}s" repeatCount="indefinite"/>`;

export const pulsa = (attr, valores, dur, atraso = 0) =>
  `<animate attributeName="${attr}" values="${valores}" dur="${dur}s" begin="${atraso}s" repeatCount="indefinite" calcMode="spline" keySplines="${valores.split(";").slice(1).map(() => ".4 0 .6 1").join(";")}" keyTimes="${valores.split(";").map((_, i, a) => n(i / (a.length - 1))).join(";")}"/>`;

export const svg = (corpo) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" role="presentation">${corpo}</svg>`;
