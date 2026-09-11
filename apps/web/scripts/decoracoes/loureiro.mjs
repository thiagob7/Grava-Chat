import { writeFileSync } from "node:fs";
import { C, R, em, n, svg } from "./_comum.mjs";

const leaf = (g, side, scale) => {
  const [x, y] = em(g, R + side * 4);
  return `<ellipse cx="0" cy="0" rx="${n(9 * scale)}" ry="${n(3.6 * scale)}"
    fill="url(#verde)" stroke="#c9a227" stroke-width=".5"
    transform="translate(${x} ${y}) rotate(${n(g + 90 + side * 34)})"/>`;
};

const branch = (direction) =>
  Array.from({ length: 11 }, (_, i) => {
    const g = 90 + direction * (12 + i * 15);
    const scale = 1 - i * 0.045;
    return leaf(g, 1, scale) + leaf(g + direction * 6, -1, scale * 0.86);
  }).join("");

const [lx, ly] = em(90, R);
const loop = `<g transform="translate(${lx} ${ly})">
  <path d="M-11 2 Q0-7 11 2 Q0 6-11 2Z" fill="#c9a227"/>
  <circle cx="0" cy="1" r="3.2" fill="#f5d67a"/>
</g>`;

writeFileSync(
  process.argv[2],
  svg(`<defs>
    <linearGradient id="verde" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3f8f4e"/><stop offset="1" stop-color="#1f5c31"/>
    </linearGradient>
  </defs>
  <g transform-origin="${C} ${C}">
    <animateTransform attributeName="transform" type="rotate"
      values="-1.6 ${C} ${C};1.6 ${C} ${C};-1.6 ${C} ${C}" dur="6s"
      repeatCount="indefinite" calcMode="spline" keyTimes="0;.5;1" keySplines=".4 0 .6 1;.4 0 .6 1"/>
    ${branch(1)}${branch(-1)}${loop}
  </g>`),
);
console.log("escrito:", process.argv[2]);
