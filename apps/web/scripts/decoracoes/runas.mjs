import { writeFileSync } from "node:fs";
import { C, R, em, inBack, spins, n, pulses, svg } from "./_comum.mjs";

const GLYPHS = [
  "M-4-5 L-4 5 M-4 0 L4-4", "M0-5 L0 5 M-4-2 L0 1 L4-2", "M-4-5 L4-5 M0-5 L0 5",
  "M-4 5 L0-5 L4 5 M-2 1 L2 1", "M-4-5 L-4 5 L4 5", "M-4-4 L4-4 M-4 0 L2 0 M-4 4 L4 4",
];

const runes = inBack(12)
  .map((g, i) => {
    const [x, y] = em(g, R);
    return `<g transform="translate(${x} ${y}) rotate(${n(g + 90)})" stroke="url(#runa)"
               stroke-width="1.8" stroke-linecap="round" fill="none" opacity=".85">
      ${pulses("opacity", ".28;1;.28", 3.4, (i % 6) * 0.55)}
      <path d="${GLYPHS[i % GLYPHS.length]}"/>
    </g>`;
  })
  .join("");

writeFileSync(
  process.argv[2],
  svg(`<defs>
    <linearGradient id="pedra" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3c4560"/><stop offset=".5" stop-color="#1b2030"/>
      <stop offset="1" stop-color="#39425c"/>
    </linearGradient>
    <linearGradient id="runa" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8ef5ff"/><stop offset="1" stop-color="#3aa6d8"/>
    </linearGradient>
  </defs>
  <circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="url(#pedra)" stroke-width="15"/>
  <circle cx="${C}" cy="${C}" r="${R - 8}" fill="none" stroke="#6fe4ff" stroke-width="1" opacity=".35"/>
  <circle cx="${C}" cy="${C}" r="${R + 8}" fill="none" stroke="#6fe4ff" stroke-width="1" opacity=".35"/>
  <g>${spins(26)}${runes}</g>`),
);
console.log("escrito:", process.argv[2]);
