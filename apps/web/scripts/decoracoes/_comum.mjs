export const C = 100;
export const R = 84;

export const rad = (g) => (g * Math.PI) / 180;
export const n = (v) => Math.round(v * 100) / 100;
export const em = (g, r = R) => [n(C + r * Math.cos(rad(g))), n(C + r * Math.sin(rad(g)))];

export const inBack = (count, de = -90) =>
  Array.from({ length: count }, (_, i) => de + (i * 360) / count);

export const spins = (dur, de = 0, until = 360) =>
  `<animateTransform attributeName="transform" type="rotate" values="${de} ${C} ${C};${until} ${C} ${C}" dur="${dur}s" repeatCount="indefinite"/>`;

export const pulses = (attr, values, dur, delay = 0) =>
  `<animate attributeName="${attr}" values="${values}" dur="${dur}s" begin="${delay}s" repeatCount="indefinite" calcMode="spline" keySplines="${values.split(";").slice(1).map(() => ".4 0 .6 1").join(";")}" keyTimes="${values.split(";").map((_, i, a) => n(i / (a.length - 1))).join(";")}"/>`;

export const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" role="presentation">${body}</svg>`;
