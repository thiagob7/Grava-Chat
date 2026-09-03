import * as React from "react";

/**
 * O desenho da setinha que liga um balão ao que o abriu — a dica e o popover.
 *
 * O Radix já POSICIONA e GIRA a seta sozinho, conforme o lado que o balão
 * acabou escolhendo; o que ele desenha é que não serve para uma superfície com
 * borda. A seta de fábrica é um polígono só, pintado e sem traço: o contorno de
 * 1px do cartão terminava na curva e a ponta saía dali como um pingo solto de
 * tinta. Balão com borda tem UM contorno, que desce por uma rampa, vira na
 * ponta e sobe pela outra.
 *
 * São duas figuras, e cada uma resolve metade:
 *
 * 1. O polígono cheio, com um COLARINHO — os dois pontos em `y=-2`, acima do
 *    `viewBox`. Ele sobe por cima da borda de baixo do cartão e a TAPA na
 *    largura da seta, que é o que apaga a linha atravessada no alto do
 *    triângulo. Sem ela apagada o contorno fecharia a base, e a seta viraria um
 *    losango partido ao meio. Isso funciona porque a seta é filha do conteúdo,
 *    e filho pinta por cima da borda do pai.
 * 2. O traço, só nas duas rampas (`M0,0 15,10 30,0`), sem a base.
 *
 * Duas medidas que parecem detalhe e não são:
 *
 * - **`non-scaling-stroke`**: o `viewBox` de 30×10 é espremido nas medidas
 *   reais com `preserveAspectRatio="none"` — 12×6 na dica, 14×7 no popover.
 *   Sem ele, o mesmo 1px sairia mais gordo na horizontal do que na vertical.
 * - **A rampa começa em `y=0`, não acima.** Tentei fazê-la subir até o meio da
 *   borda para "emendar melhor", e o resultado foi ela furar a linha e desenhar
 *   um X na junção. Quem emenda é o colarinho, não a rampa.
 *
 * Os dois pontos de uso passam `overflow-visible` no `<svg>`, porque o
 * colarinho e a espessura do traço passam do `viewBox` e o padrão é cortar.
 *
 * As duas medidas vivem aqui juntas de propósito: são a mesma seta em dois
 * tamanhos, e um colarinho que só um dos dois recebesse seria um bug de um
 * pixel que ninguém acharia olhando o arquivo do outro.
 */
export const DesenhoDaSeta: React.FC = () => (
  <>
    <polygon points="0,-2 30,-2 30,0 15,10 0,0" className="fill-surface-4" />
    <path
      d="M0,0 15,10 30,0"
      fill="none"
      strokeWidth={1}
      vectorEffect="non-scaling-stroke"
      className="stroke-line"
    />
  </>
);
