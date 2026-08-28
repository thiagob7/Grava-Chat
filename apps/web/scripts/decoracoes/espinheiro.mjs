/*
  Gera `src/assets/molduras/espinheiro.svg` — ramo de espinhos, o contraponto
  escuro das outras duas.

    node scripts/decoracoes/espinheiro.mjs src/assets/molduras/espinheiro.svg
*/
import { writeFileSync } from "node:fs";
import { F, L, montar, n } from "./_moldura.mjs";

const RAMO = "#7d9470";
const PONTA = "#eaf2e4";

/// O espinho é um triângulo fino saindo do ramo, sempre pro lado de fora.
/// O espinho cresce e recolhe. O `scale` só no eixo Y: crescer nos dois
/// engorda a base e o espinho vira folha.
const espinho = (x, y, g, t = 1, atraso = 0) =>
  `<g transform="translate(${x} ${y}) rotate(${g})"><g>
    <animateTransform attributeName="transform" type="scale" values="1 0.55;1 1;1 0.55"
      dur="8s" begin="${atraso}s" repeatCount="indefinite" calcMode="spline"
      keyTimes="0;0.5;1" keySplines=".4 0 .6 1;.4 0 .6 1"/>
    <path d="M0 0 L${n(-3.4 * t)} ${n(-11 * t)} L${n(3.4 * t)} 0Z" fill="${PONTA}"/>
  </g></g>`;

const canto = `
  <path d="M${F} 14 C33 14 21 21 15 31 C11 38 11 42 11 ${F}"
        fill="none" stroke="${RAMO}" stroke-width="4.4" stroke-linecap="round"/>
  ${espinho(40, 12, 24, 1.2, 0)}${espinho(27, 16, 8, 1, 1.3)}
  ${espinho(16, 27, -78, 1, 2.6)}${espinho(12, 40, -104, 1.2, 3.9)}
  ${espinho(24, 22, 138, 0.8, 5.2)}
  <circle cx="21" cy="21" r="3.4" fill="${PONTA}" opacity=".85"/>`;

const beira = `
  <path d="M${F} 16 C84 4 116 30 150 16 C184 2 216 28 ${L - F} 16"
        fill="none" stroke="${RAMO}" stroke-width="4" stroke-linecap="round"/>
  ${espinho(78, 11, 12, 1, 0)}${espinho(112, 20, -8, 1, 1.6)}
  ${espinho(150, 15, 6, 1, 3.2)}${espinho(188, 20, 8, 1, 4.8)}${espinho(222, 11, -12, 1, 6.4)}
  ${espinho(95, 22, 170, 0.7, 2.4)}${espinho(205, 22, 190, 0.7, 5.6)}`;

writeFileSync(process.argv[2], montar({ canto, beira }));
console.log("escrito:", process.argv[2]);
