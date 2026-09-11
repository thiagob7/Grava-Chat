import { themeColor, between, tinta } from "~/features/tema/lib/fundos/comum";
import type { Motor } from "~/features/tema/lib/fundos/tipos";

/*
  Nuvens de cor que se atravessam.

  Cada nuvem é um gradiente radial grande andando numa elipse própria, e o
  desenho é somado com `lighter`: onde duas se cruzam nasce uma terceira cor
  que ninguém escolheu. É isso que separa uma nebulosa de três manchas
  paradas num degradê.

  As cores saem do próprio tema, então o mesmo motor serve a uma nebulosa
  roxa e a uma verde sem virar efeito genérico.
*/
interface Cloud {
  radius: number;
  color: number[];
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  back: number;
  phase: number;
  pulse: number;
  force: number;
}

export function nebula(): Motor {
  let clouds: Cloud[] = [];
  let clock = 0;

  const palette = [
    themeColor("--color-brand", [126, 63, 255]),
    themeColor("--color-link", [0, 174, 255]),
    themeColor("--color-everyone", [255, 60, 170]),
  ];

  const seed = (width: number, height: number) => {
    const measure = Math.max(width, height);

    /*
      Tamanhos bem diferentes, de propósito. Seis nuvens da mesma medida no
      meio da tela somam num borrão só, que foi exatamente o que aconteceu
      na primeira tentativa. As grandes dão o clima, as pequenas dão o
      desenho — e são elas que fazem o olho achar profundidade.
    */
    const measures = [0.46, 0.38, 0.3, 0.22, 0.17, 0.13, 0.1, 0.08];

    clouds = measures.map((m, i) => ({
      radius: measure * m * between(0.85, 1.15),
      color: palette[i % palette.length]!,
      cx: between(0.05, 0.95),
      cy: between(0.08, 0.92),
      rx: between(0.05, 0.2),
      ry: between(0.04, 0.16),
      back: between(20, 68) * (Math.random() < 0.5 ? -1 : 1),
      phase: between(0, Math.PI * 2),
      pulse: between(0.05, 0.15),
      /* A pequena é mais densa: nuvem que some de perto não é nuvem. */
      force: 0.1 + (1 - m) * 0.24,
    }));
  };

  return {
    resized: (stage) => seed(stage.width, stage.height),

    frame: ({ context: ctx, width, height }, step) => {
      if (!clouds.length) seed(width, height);

      ctx.clearRect(0, 0, width, height);
      clock += step;
      ctx.globalCompositeOperation = "lighter";

      for (const n of clouds) {
        const angle = (clock / n.back) * Math.PI * 2 + n.phase;
        const x = (n.cx + Math.cos(angle) * n.rx) * width;
        const y = (n.cy + Math.sin(angle) * n.ry) * height;
        const force = n.force * (0.78 + 0.22 * Math.sin(clock * n.pulse + n.phase));

        const brush = ctx.createRadialGradient(x, y, 0, x, y, n.radius);
        brush.addColorStop(0, tinta(n.color, force));
        brush.addColorStop(0.55, tinta(n.color, force * 0.32));
        brush.addColorStop(1, tinta(n.color, 0));

        ctx.fillStyle = brush;
        ctx.beginPath();
        ctx.arc(x, y, n.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
    },
  };
}
