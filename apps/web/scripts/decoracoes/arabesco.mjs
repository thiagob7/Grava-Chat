/*
  Gera `src/assets/molduras/arabesco.svg` — volutas douradas, no espírito da
  filigrana de rosas mas sem flor: só o desenho do ferro trabalhado.

    node scripts/decoracoes/arabesco.mjs src/assets/molduras/arabesco.svg
*/
import { writeFileSync } from "node:fs";
import { F, L, montar } from "./_moldura.mjs";

const OURO = "#e8c266";
const SOMBRA = "#8a6516";

/// A voluta é o motivo inteiro: um caracol que abre num traço. Três voltas
/// bastam — mais que isso vira borrão no tamanho em que ela é vista.
const voluta = (x, y, r, giro) => `<g transform="translate(${x} ${y}) rotate(${giro})">
  <path d="M0 0 A${r * 0.34} ${r * 0.34} 0 1 1 ${-r * 0.5} ${-r * 0.16}
           A${r * 0.66} ${r * 0.66} 0 1 0 ${r * 0.22} ${-r * 0.86}"
        fill="none" stroke="url(#ferro)" stroke-width="${r * 0.2}" stroke-linecap="round"/>
</g>`;

const gota = (x, y, g) =>
  `<path d="M0 0 C4-5 9-5 11 0 C9 5 4 5 0 0Z" fill="${OURO}" opacity=".85"
     transform="translate(${x} ${y}) rotate(${g})"/>`;

const canto = `
  <path d="M${F} 10 C34 10 22 18 16 28 C12 35 12 41 12 ${F}"
        fill="none" stroke="url(#ferro)" stroke-width="3.4" stroke-linecap="round"/>
  <path d="M${F} 21 C38 21 29 27 25 35 C22 40 22 43 22 ${F}"
        fill="none" stroke="${OURO}" stroke-width="1.3" stroke-linecap="round" opacity=".6"/>
  ${voluta(24, 24, 22, 20)}
  ${gota(34, 12, -24)}${gota(10, 34, -114)}`;

const beira = `
  <path d="M${F} 16 C80 2 106 30 150 16 C194 2 220 30 ${L - F} 16"
        fill="none" stroke="url(#ferro)" stroke-width="3.2" stroke-linecap="round"/>
  <path d="M${F} 24 C82 12 106 38 150 24 C194 10 218 36 ${L - F} 24"
        fill="none" stroke="${OURO}" stroke-width="1.2" stroke-linecap="round" opacity=".5"/>
  ${voluta(150, 30, 15, 0)}
  ${gota(96, 12, 16)}${gota(196, 12, -16)}`;

const defs = `<linearGradient id="ferro" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff0c2"/><stop offset=".5" stop-color="${OURO}"/>
    <stop offset="1" stop-color="${SOMBRA}"/>
  </linearGradient>`;

writeFileSync(process.argv[2], montar({ canto, beira, defs }));
console.log("escrito:", process.argv[2]);
