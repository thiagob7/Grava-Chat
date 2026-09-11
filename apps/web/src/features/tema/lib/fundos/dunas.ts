import { themeColor, ripple, tinta } from "~/features/tema/lib/fundos/comum";
import type { Motor } from "~/features/tema/lib/fundos/tipos";

/*
  Cristas de duna, uma atrás da outra.

  Cada camada é um recorte cheio, ancorado no rodapé, e a de trás é mais
  clara: é a névoa de distância que dá a profundidade. Sem ela seriam cinco
  silhuetas empilhadas.

  O perfil vem de ruído somado a uma senoide larga. Só senoide daria colina
  de desenho animado; só ruído daria serra.
*/
const LAYERS = 7;

export function dunes(): Motor {
  let clock = 0;
  const near = themeColor("--color-surface-3", [58, 44, 30]);
  const longe = themeColor("--color-brand", [206, 150, 78]);

  return {
    frame: ({ context: ctx, width, height }, step) => {
      ctx.clearRect(0, 0, width, height);
      clock += step;

      for (let c = LAYERS - 1; c >= 0; c--) {
        const t = c / (LAYERS - 1);
        const base = height * (0.5 + t * 0.56);
        /*
          Duna é longa e rasa. A primeira versão usava um sexto da altura da
          tela por crista e o resultado era serra, não deserto.
        */
        const high = height * (0.035 + (1 - t) * 0.03);
        const swipe = clock * (0.008 + (1 - t) * 0.02);
        const scale = 0.9 + t * 1.3;

        /*
          A crista da frente é a mais escura, e a do fundo some na névoa.
          Estava ao contrário e o deserto ficava com a areia mais clara
          justo onde ela devia ser silhueta.
        */
        const color = near.map((v, i) => v + (longe[i]! - v) * t * 0.7);

        ctx.fillStyle = tinta(color, 0.4 - t * 0.26);
        ctx.beginPath();
        ctx.moveTo(-10, height + 10);

        for (let x = -10; x <= width + 10; x += 9) {
          const u = (x / width) * scale + swipe;
          const y =
            base -
            (ripple(u * 3) - 0.5) * high * 2 -
            Math.sin(u * 2.1 + c) * high * 0.6;

          ctx.lineTo(x, y);
        }

        ctx.lineTo(width + 10, height + 10);
        ctx.closePath();
        ctx.fill();
      }
    },
  };
}
