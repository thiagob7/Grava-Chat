import { writeFileSync } from "node:fs";

const L = 300;
const F = 48;
const CREME = "#f7f2e7";
const SOMBRA = "#b9a6e0";
const RAMO = "#8f7cc4";

const rosa = (x, y, r, atraso = 0) => `<g transform="translate(${x} ${y})"><g>
  <animateTransform attributeName="transform" type="scale"
    values="1;1.07;1" dur="6s" begin="${atraso}s" repeatCount="indefinite"
    calcMode="spline" keyTimes="0;0.5;1" keySplines=".4 0 .6 1;.4 0 .6 1"/>
  <circle r="${r}" fill="${CREME}" stroke="${SOMBRA}" stroke-width="${r * 0.13}"/>
  <path d="M${-r * 0.6} ${r * 0.22} A${r * 0.6} ${r * 0.6} 0 1 1 ${r * 0.48} ${-r * 0.3}"
        fill="none" stroke="${SOMBRA}" stroke-width="${r * 0.16}" stroke-linecap="round"/>
  <path d="M${-r * 0.3} ${r * 0.26} A${r * 0.34} ${r * 0.34} 0 1 1 ${r * 0.28} ${-r * 0.06}"
        fill="none" stroke="${SOMBRA}" stroke-width="${r * 0.16}" stroke-linecap="round"/>
</g></g>`;

const folha = (x, y, g, e = 1) =>
  `<ellipse rx="${6.5 * e}" ry="${2.7 * e}" fill="${CREME}" stroke="${SOMBRA}"
     stroke-width="1" transform="translate(${x} ${y}) rotate(${g})"/>`;

const canto = `<g id="canto">
  <path d="M48 12 C32 12 20 20 14 30 C10 37 10 42 10 48"
        fill="none" stroke="${RAMO}" stroke-width="3.2" stroke-linecap="round"/>
  <path d="M48 22 C36 22 27 28 23 36 C20 41 20 44 20 48"
        fill="none" stroke="${RAMO}" stroke-width="1.4" stroke-linecap="round" opacity=".6"/>
  ${folha(40, 9, -22)}${folha(9, 40, -68)}
  ${rosa(19, 19, 14)}
</g>`;

const beira = `<g id="beira">
  <path d="M48 15 C82 2 116 30 150 15 C184 0 218 28 252 15"
        fill="none" stroke="${RAMO}" stroke-width="3" stroke-linecap="round"/>
  <path d="M48 22 C84 10 116 37 150 22 C184 7 216 34 252 22"
        fill="none" stroke="${RAMO}" stroke-width="1.3" stroke-linecap="round" opacity=".55"/>
  ${folha(100, 10, 28)}${folha(150, 26, 0)}${folha(200, 10, -28)}
</g>`;

writeFileSync(
  process.argv[2],
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L} ${L}" width="${L}" height="${L}" role="presentation">
  <defs>${canto}${beira}</defs>
  <use href="#canto"/>
  <use href="#canto" transform="translate(${L} 0) scale(-1 1)"/>
  <use href="#canto" transform="translate(0 ${L}) scale(1 -1)"/>
  <use href="#canto" transform="translate(${L} ${L}) scale(-1 -1)"/>
  <use href="#beira"/>
  <use href="#beira" transform="translate(0 ${L}) scale(1 -1)"/>
  <use href="#beira" transform="rotate(90 ${L / 2} ${L / 2})"/>
  <use href="#beira" transform="rotate(-90 ${L / 2} ${L / 2})"/>
</svg>`,
);
console.log("escrito:", process.argv[2], "— fatia", F);
