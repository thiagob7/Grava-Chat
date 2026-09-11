import { writeFileSync } from "node:fs";
import { F, L, build } from "./_moldura.mjs";

const COLOR = "#cbb98a";

const STEP = 34;
const GAP = L - 2 * F;

const key = (x) =>
  `M${x} 40 L${x} 10 L${x + 28} 10 L${x + 28} 31 L${x + 10} 31 L${x + 10} 20 L${x + 20} 20`;

const beira = `
  <path d="${Array.from({ length: GAP / STEP }, (_, i) => key(F + i * STEP)).join(" ")}"
        fill="none" stroke="${COLOR}" stroke-width="3" stroke-linejoin="miter" stroke-linecap="square"/>
  <path d="M${F} 44 L${L - F} 44" stroke="${COLOR}" stroke-width="1.4" opacity=".55"/>`;

const corner = `
  <path d="M10 ${F} L10 10 L${F} 10" fill="none" stroke="${COLOR}" stroke-width="3"
        stroke-linejoin="miter" stroke-linecap="square"/>
  <path d="M20 ${F} L20 20 L${F} 20" fill="none" stroke="${COLOR}" stroke-width="3"
        stroke-linejoin="miter" stroke-linecap="square"/>
  <path d="M30 ${F} L30 30 L${F} 30" fill="none" stroke="${COLOR}" stroke-width="1.8"
        opacity=".6" stroke-linejoin="miter" stroke-linecap="square"/>
  <path d="M44 ${F} L44 44 L${F} 44" fill="none" stroke="${COLOR}" stroke-width="1.4"
        opacity=".55" stroke-linejoin="miter" stroke-linecap="square"/>`;

writeFileSync(process.argv[2], build({ corner, beira }));
console.log("escrito:", process.argv[2]);
