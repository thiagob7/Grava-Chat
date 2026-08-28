/*
  Gera `src/assets/molduras/grega.svg` — meandro grego, a única geométrica do
  conjunto. Existe porque as outras são todas orgânicas e curvas: quem quer
  moldura sóbria não tinha opção desenhada.

    node scripts/decoracoes/grega.mjs src/assets/molduras/grega.svg
*/
import { writeFileSync } from "node:fs";
import { F, L, montar } from "./_moldura.mjs";

const COR = "#cbb98a";

/*
  O passo do meandro divide EXATAMENTE o vão entre os cantos (204 = 6 x 34).

  Se não dividir, o ladrilho corta um passo no meio e a emenda salta à vista —
  e o `round` do border-image só ajusta a escala, não conserta um motivo
  incompleto.
*/
const PASSO = 34;
const VAO = L - 2 * F;

const chave = (x) =>
  `M${x} 40 L${x} 10 L${x + 28} 10 L${x + 28} 31 L${x + 10} 31 L${x + 10} 20 L${x + 20} 20`;

const beira = `
  <path d="${Array.from({ length: VAO / PASSO }, (_, i) => chave(F + i * PASSO)).join(" ")}"
        fill="none" stroke="${COR}" stroke-width="3" stroke-linejoin="miter" stroke-linecap="square"/>
  <path d="M${F} 44 L${L - F} 44" stroke="${COR}" stroke-width="1.4" opacity=".55"/>`;

/// No canto a chave vira: entra pelo topo e sai pela lateral, no mesmo traço.
const canto = `
  <path d="M10 ${F} L10 10 L${F} 10" fill="none" stroke="${COR}" stroke-width="3"
        stroke-linejoin="miter" stroke-linecap="square"/>
  <path d="M20 ${F} L20 20 L${F} 20" fill="none" stroke="${COR}" stroke-width="3"
        stroke-linejoin="miter" stroke-linecap="square"/>
  <path d="M30 ${F} L30 30 L${F} 30" fill="none" stroke="${COR}" stroke-width="1.8"
        opacity=".6" stroke-linejoin="miter" stroke-linecap="square"/>
  <path d="M44 ${F} L44 44 L${F} 44" fill="none" stroke="${COR}" stroke-width="1.4"
        opacity=".55" stroke-linejoin="miter" stroke-linecap="square"/>`;

writeFileSync(process.argv[2], montar({ canto, beira }));
console.log("escrito:", process.argv[2]);
