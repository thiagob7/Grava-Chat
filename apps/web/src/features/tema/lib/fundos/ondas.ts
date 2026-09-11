import { themeColor, tinta } from "~/features/tema/lib/fundos/comum";
import type { Motor } from "~/features/tema/lib/fundos/tipos";

/*
  Faixas de luz atravessando a tela.

  Cada faixa é a soma de três senoides de frequências que não se dividem, o
  que impede o desenho de voltar ao mesmo lugar e virar padrão. A opacidade
  cai nas pontas, então a faixa entra e sai da tela sem borda reta.
*/
const TRACKS = 7;

export function waves(): Motor {
  let clock = 0;
  const color = themeColor("--color-brand", [110, 150, 255]);
  const second = themeColor("--color-link", [90, 220, 220]);

  return {
    frame: ({ context: ctx, width, height }, step) => {
      ctx.clearRect(0, 0, width, height);
      clock += step;

      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";

      for (let i = 0; i < TRACKS; i++) {
        const t = i / (TRACKS - 1);
        const base = height * (0.18 + t * 0.66);
        const amplitude = height * (0.05 + 0.05 * (1 - t));
        const swipe = clock * (0.16 + t * 0.13);
        const picked = i % 2 ? second : color;

        const brush = ctx.createLinearGradient(0, 0, width, 0);
        brush.addColorStop(0, tinta(picked, 0));
        brush.addColorStop(0.28, tinta(picked, 0.16 - t * 0.06));
        brush.addColorStop(0.72, tinta(picked, 0.16 - t * 0.06));
        brush.addColorStop(1, tinta(picked, 0));

        ctx.strokeStyle = brush;
        ctx.lineWidth = 26 + t * 40;
        ctx.beginPath();

        for (let x = -20; x <= width + 20; x += 12) {
          const u = x / width;
          const y =
            base +
            Math.sin(u * 3.1 + swipe) * amplitude +
            Math.sin(u * 7.3 - swipe * 1.4) * amplitude * 0.38 +
            Math.sin(u * 1.7 + swipe * 0.6) * amplitude * 0.5;

          if (x === -20) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.stroke();
      }

      ctx.globalCompositeOperation = "source-over";
    },
  };
}
