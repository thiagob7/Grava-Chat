import { themeColor, between, tinta } from "~/features/tema/lib/fundos/comum";
import type { Motor } from "~/features/tema/lib/fundos/tipos";

/*
  Neve com profundidade.

  O que faz neve parecer neve não é o floco, é a distância entre eles: o que
  está perto é grande, rápido e desfocado; o que está longe é um pontinho
  quase parado. Uma camada só de flocos iguais lê como chuvisco.

  O vento é uma senoide lenta com duas frequências, para a rajada não bater
  no mesmo compasso o tempo todo.
*/
const LAYERS = [
  { count: 90, radius: [0.7, 1.4], fall: [14, 26], alfa: [0.3, 0.5], derives: 8 },
  { count: 55, radius: [1.4, 2.4], fall: [26, 44], alfa: [0.5, 0.75], derives: 16 },
  { count: 26, radius: [2.4, 4.2], fall: [44, 70], alfa: [0.7, 0.95], derives: 26 },
];

interface Flake {
  x: number;
  y: number;
  radius: number;
  fall: number;
  alfa: number;
  derives: number;
  phase: number;
}

export function neve(): Motor {
  let flakes: Flake[] = [];
  let clock = 0;
  const color = themeColor("--color-brilho", [255, 255, 255]);

  const seed = (width: number, height: number) => {
    flakes = LAYERS.flatMap((layer) =>
      Array.from({ length: layer.count }, () => ({
        x: between(0, width),
        y: between(0, height),
        radius: between(layer.radius[0]!, layer.radius[1]!),
        fall: between(layer.fall[0]!, layer.fall[1]!),
        alfa: between(layer.alfa[0]!, layer.alfa[1]!),
        derives: layer.derives,
        phase: between(0, Math.PI * 2),
      })),
    );
  };

  return {
    resized: (stage) => seed(stage.width, stage.height),

    frame: ({ context: ctx, width, height }, step) => {
      if (!flakes.length) seed(width, height);

      ctx.clearRect(0, 0, width, height);
      clock += step;

      const gust = Math.sin(clock * 0.24) * 0.7 + Math.sin(clock * 0.09) * 0.3;

      for (const f of flakes) {
        f.y += f.fall * step;
        f.x += (gust * f.derives + Math.sin(clock * 0.8 + f.phase) * f.derives * 0.4) * step;

        if (f.y - f.radius > height) {
          f.y = -f.radius;
          f.x = between(0, width);
        }

        if (f.x < -8) f.x = width + 8;
        else if (f.x > width + 8) f.x = -8;

        ctx.beginPath();
        ctx.fillStyle = tinta(color, f.alfa);
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  };
}
