import { writeFileSync } from "node:fs";
import { C, R, em, inBack, spins, n, pulses, svg } from "./_comum.mjs";

const studs = inBack(32)
  .map((g) => {
    const [x, y] = em(g);
    return `<circle cx="${x}" cy="${y}" r="1.7" fill="#f7e6a8" opacity=".75"/>`;
  })
  .join("");

const gems = [45, 135, 225, 315]
  .map((g, i) => {
    const [x, y] = em(g);
    return `<g transform="translate(${x} ${y}) rotate(45)">
      <rect x="-6.5" y="-6.5" width="13" height="13" rx="1.6" fill="#7d1220"/>
      <rect x="-4.8" y="-4.8" width="9.6" height="9.6" rx="1.2" fill="url(#gema)"/>
      <rect x="-4.8" y="-4.8" width="9.6" height="4.4" rx="1.2" fill="#fff" opacity=".28">
        ${pulses("opacity", ".18;.7;.18", 2.6, i * 0.65)}
      </rect>
    </g>`;
  })
  .join("");

const back = 2 * Math.PI * R;
const flash = `<g>${spins(7)}
  <circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="#fffbe8" stroke-width="9"
          stroke-linecap="round" opacity=".55"
          stroke-dasharray="${n(back * 0.14)} ${n(back * 0.86)}"/>
</g>`;

writeFileSync(
  process.argv[2],
  svg(`<defs>
    <linearGradient id="ouro" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7a4f10"/><stop offset=".22" stop-color="#f5d67a"/>
      <stop offset=".5" stop-color="#c9982f"/><stop offset=".78" stop-color="#f7e6a8"/>
      <stop offset="1" stop-color="#7a4f10"/>
    </linearGradient>
    <radialGradient id="gema"><stop offset="0" stop-color="#ff6b6b"/><stop offset="1" stop-color="#c0182c"/></radialGradient>
  </defs>
  <circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="url(#ouro)" stroke-width="11"/>
  <circle cx="${C}" cy="${C}" r="${R - 6.5}" fill="none" stroke="#f7e6a8" stroke-width="1.4" opacity=".8"/>
  <circle cx="${C}" cy="${C}" r="${R + 6.5}" fill="none" stroke="#f7e6a8" stroke-width="1.4" opacity=".8"/>
  ${flash}${studs}${gems}`),
);
console.log("escrito:", process.argv[2]);
