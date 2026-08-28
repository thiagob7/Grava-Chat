/*
  Montagem comum das molduras de cartão desenhadas.

  Todas usam `border-image` com fatiamento 9: o CSS recorta o quadro em nove
  pedaços, joga os quatro cantos inteiros nos cantos do cartão e ladrilha as
  quatro beiras ao longo dos lados. Por isso o desenho só precisa de UM canto e
  UMA beira — os outros seis pedaços são o mesmo desenho espelhado e girado.

  Duas regras que o formato impõe, e que quebram silenciosamente se ignoradas:

  - a BEIRA precisa fechar: o traço que sai em x=L-F tem que entrar na mesma
    altura em x=F, senão aparece emenda a cada repetição do ladrilho;
  - nada pode passar de F pixels da borda, que é a fatia — o que passar é
    recortado pro miolo, que o `border-image` descarta.
*/
export const L = 300;   // lado do quadro
export const F = 48;    // a fatia: a espessura da faixa desenhada

export const n = (v) => Math.round(v * 100) / 100;

export function montar({ canto, beira, defs = "" }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L} ${L}" width="${L}" height="${L}" role="presentation">
  <defs>${defs}<g id="canto">${canto}</g><g id="beira">${beira}</g></defs>
  <use href="#canto"/>
  <use href="#canto" transform="translate(${L} 0) scale(-1 1)"/>
  <use href="#canto" transform="translate(0 ${L}) scale(1 -1)"/>
  <use href="#canto" transform="translate(${L} ${L}) scale(-1 -1)"/>
  <use href="#beira"/>
  <use href="#beira" transform="translate(0 ${L}) scale(1 -1)"/>
  <use href="#beira" transform="rotate(90 ${L / 2} ${L / 2})"/>
  <use href="#beira" transform="rotate(-90 ${L / 2} ${L / 2})"/>
</svg>`;
}
