import { themeColor, between, pick, tinta } from "~/features/tema/lib/fundos/comum";
import type { Motor } from "~/features/tema/lib/fundos/tipos";

/*
  Corredores que se desenham sozinhos.

  Uns poucos caminhantes andam sobre uma grade, virando às vezes, deixando
  o traço para trás. O rastro não é guardado: a tela é apagada com um preto
  quase transparente por quadro, e o corredor some devagar atrás de quem
  passou. Guardar o traço encheria a tela em meio minuto.

  O caminhante morre ao sair da tela e nasce outro na borda. Sem isso todos
  acabam num canto e o desenho para.
*/
const GRID = 26;
const STEPS_BY_SECOND = 13;
const COUNT = 5;

const HEADINGS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

interface Walker {
  x: number;
  y: number;
  heading: readonly [number, number];
  glow: number;
}

export function maze(): Motor {
  let walkers: Walker[] = [];
  let leftover = 0;
  const color = themeColor("--color-brand", [120, 200, 255]);

  const born = (width: number, height: number): Walker => ({
    x: Math.round(between(0, width / GRID)) * GRID,
    y: Math.round(between(0, height / GRID)) * GRID,
    heading: pick(HEADINGS),
    glow: between(0.5, 1),
  });

  return {
    resized: () => {
      walkers = [];
    },

    frame: ({ context: ctx, width, height }, step) => {
      if (!walkers.length) {
        walkers = Array.from({ length: COUNT }, () => born(width, height));
      }

      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0, 0, 0, 0.022)";
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "square";

      leftover += step * STEPS_BY_SECOND;

      while (leftover >= 1) {
        leftover -= 1;

        for (let i = 0; i < walkers.length; i++) {
          const a = walkers[i]!;
          const fromX = a.x;
          const fromY = a.y;

          /*
            Vira em quatro de cada dez passos, e nunca para trás: dar meia
            volta deixaria o traço em cima do que acabou de sair, e o
            corredor pisca em vez de crescer.
          */
          if (Math.random() < 0.4) {
            const perpendicular = HEADINGS.filter(
              (r) => r[0] !== -a.heading[0] || r[1] !== -a.heading[1],
            ).filter((r) => r[0] !== a.heading[0] || r[1] !== a.heading[1]);

            a.heading = pick(perpendicular);
          }

          a.x += a.heading[0] * GRID;
          a.y += a.heading[1] * GRID;

          ctx.strokeStyle = tinta(color, 0.5 * a.glow);
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(fromX, fromY);
          ctx.lineTo(a.x, a.y);
          ctx.stroke();

          ctx.fillStyle = tinta(color, 0.9 * a.glow);
          ctx.beginPath();
          ctx.arc(a.x, a.y, 1.8, 0, Math.PI * 2);
          ctx.fill();

          const outside =
            a.x < -GRID || a.y < -GRID || a.x > width + GRID || a.y > height + GRID;

          if (outside) walkers[i] = born(width, height);
        }
      }

      ctx.globalCompositeOperation = "source-over";
    },
  };
}
