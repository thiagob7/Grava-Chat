import { corDoTema, tinta } from "~/features/tema/lib/fundos/comum";
import type { Motor } from "~/features/tema/lib/fundos/tipos";

/*
  Faixas de luz atravessando a tela.

  Cada faixa é a soma de três senoides de frequências que não se dividem, o
  que impede o desenho de voltar ao mesmo lugar e virar padrão. A opacidade
  cai nas pontas, então a faixa entra e sai da tela sem borda reta.
*/
const FAIXAS = 7;

export function ondas(): Motor {
  let relogio = 0;
  const cor = corDoTema("--color-brand", [110, 150, 255]);
  const segunda = corDoTema("--color-link", [90, 220, 220]);

  return {
    quadro: ({ contexto: ctx, largura, altura }, passo) => {
      ctx.clearRect(0, 0, largura, altura);
      relogio += passo;

      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";

      for (let i = 0; i < FAIXAS; i++) {
        const t = i / (FAIXAS - 1);
        const base = altura * (0.18 + t * 0.66);
        const amplitude = altura * (0.05 + 0.05 * (1 - t));
        const deslize = relogio * (0.16 + t * 0.13);
        const escolhida = i % 2 ? segunda : cor;

        const pincel = ctx.createLinearGradient(0, 0, largura, 0);
        pincel.addColorStop(0, tinta(escolhida, 0));
        pincel.addColorStop(0.28, tinta(escolhida, 0.16 - t * 0.06));
        pincel.addColorStop(0.72, tinta(escolhida, 0.16 - t * 0.06));
        pincel.addColorStop(1, tinta(escolhida, 0));

        ctx.strokeStyle = pincel;
        ctx.lineWidth = 26 + t * 40;
        ctx.beginPath();

        for (let x = -20; x <= largura + 20; x += 12) {
          const u = x / largura;
          const y =
            base +
            Math.sin(u * 3.1 + deslize) * amplitude +
            Math.sin(u * 7.3 - deslize * 1.4) * amplitude * 0.38 +
            Math.sin(u * 1.7 + deslize * 0.6) * amplitude * 0.5;

          if (x === -20) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.stroke();
      }

      ctx.globalCompositeOperation = "source-over";
    },
  };
}
