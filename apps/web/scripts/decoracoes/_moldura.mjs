export const L = 300;
export const F = 48;

export const n = (v) => Math.round(v * 100) / 100;

export function build({ corner, beira, defs = "" }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L} ${L}" width="${L}" height="${L}" role="presentation">
  <defs>${defs}<g id="canto">${corner}</g><g id="beira">${beira}</g></defs>
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
