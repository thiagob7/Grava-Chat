import { themeColor, between, tinta } from "~/features/tema/lib/fundos/comum";
import type { Motor } from "~/features/tema/lib/fundos/tipos";

/*
  Fitas de cetim atravessando a tela.

  Cada fita é uma faixa entre duas curvas: a linha de cima e a de baixo, com
  larguras diferentes ao longo do caminho. É a largura variando que dá a
  torção — fita de largura fixa lê como cano.

  A luz é um segundo traço mais claro correndo pela metade de cima, que é
  onde a fita pegaria luz se fosse pano de verdade.
*/
const COUNT = 5;

interface Ribbon {
  height: number;
  amplitude: number;
  width: number;
  pace: number;
  phase: number;
  color: number[];
  alfa: number;
}

export function ribbons(): Motor {
  let clock = 0;
  let strips: Ribbon[] = [];

  const palette = [
    themeColor("--color-brand", [190, 120, 255]),
    themeColor("--color-link", [110, 200, 255]),
    themeColor("--color-everyone", [255, 130, 190]),
  ];

  const seed = () => {
    strips = Array.from({ length: COUNT }, (_, i) => ({
      height: 0.16 + (i / COUNT) * 0.68 + between(-0.04, 0.04),
      amplitude: between(0.05, 0.13),
      width: between(26, 62),
      pace: between(0.1, 0.24) * (Math.random() < 0.5 ? -1 : 1),
      phase: between(0, Math.PI * 2),
      color: palette[i % palette.length]!,
      alfa: between(0.1, 0.2),
    }));
  };

  return {
    resized: seed,

    frame: ({ context: ctx, width, height }, step) => {
      if (!strips.length) seed();

      ctx.clearRect(0, 0, width, height);
      clock += step;
      ctx.globalCompositeOperation = "lighter";

      for (const f of strips) {
        const base = height * f.height;
        const amp = height * f.amplitude;
        const anda = clock * f.pace + f.phase;

        const line = (x: number) => {
          const u = x / width;
          return (
            base +
            Math.sin(u * 4.2 + anda) * amp +
            Math.sin(u * 9.1 - anda * 1.7) * amp * 0.26
          );
        };

        const thickness = (x: number) => {
          const u = x / width;
          return f.width * (0.35 + 0.65 * Math.abs(Math.sin(u * 2.6 + anda * 1.3)));
        };

        ctx.beginPath();

        for (let x = -20; x <= width + 20; x += 14) {
          const y = line(x) - thickness(x) / 2;
          if (x === -20) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        for (let x = width + 20; x >= -20; x -= 14) {
          ctx.lineTo(x, line(x) + thickness(x) / 2);
        }

        ctx.closePath();
        ctx.fillStyle = tinta(f.color, f.alfa);
        ctx.fill();

        ctx.beginPath();

        for (let x = -20; x <= width + 20; x += 14) {
          const y = line(x) - thickness(x) * 0.28;
          if (x === -20) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.strokeStyle = tinta(f.color, f.alfa * 1.5);
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }

      ctx.globalCompositeOperation = "source-over";
    },
  };
}
