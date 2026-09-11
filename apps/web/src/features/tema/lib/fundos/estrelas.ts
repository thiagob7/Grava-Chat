import { themeColor, between, tinta } from "~/features/tema/lib/fundos/comum";
import type { Motor } from "~/features/tema/lib/fundos/tipos";

/*
  Campo de estrelas com paralaxe.

  Três profundidades andando em velocidades diferentes na diagonal. O que
  vende o céu é a minoria: umas poucas estrelas ganham uma cruz de luz e
  piscam fora de compasso. Todas piscando junto vira pisca-pisca de natal.
*/
interface Star {
  x: number;
  y: number;
  radius: number;
  alfa: number;
  step: number;
  twinkles: number;
  phase: number;
  cross: boolean;
}

export function stars(): Motor {
  let field: Star[] = [];
  let clock = 0;
  const color = themeColor("--color-brilho", [220, 228, 255]);

  const seed = (width: number, height: number) => {
    const count = Math.round((width * height) / 5200);

    field = Array.from({ length: count }, () => {
      const background = Math.random();

      return {
        x: between(0, width),
        y: between(0, height),
        radius: 0.5 + background * 1.5,
        alfa: 0.25 + background * 0.6,
        step: 1.5 + background * 7,
        twinkles: Math.random() < 0.3 ? between(0.6, 1.8) : 0,
        phase: between(0, Math.PI * 2),
        cross: background > 0.88,
      };
    });
  };

  return {
    resized: (stage) => seed(stage.width, stage.height),

    frame: ({ context: ctx, width, height }, step) => {
      if (!field.length) seed(width, height);

      ctx.clearRect(0, 0, width, height);
      clock += step;

      for (const e of field) {
        e.x += e.step * step * 0.35;
        e.y += e.step * step * 0.14;

        if (e.x > width + 2) e.x = -2;
        if (e.y > height + 2) e.y = -2;

        const glow = e.twinkles
          ? e.alfa * (0.55 + 0.45 * Math.sin(clock * e.twinkles + e.phase))
          : e.alfa;

        ctx.beginPath();
        ctx.fillStyle = tinta(color, glow);
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fill();

        if (!e.cross) continue;

        const arm = e.radius * 5;
        ctx.strokeStyle = tinta(color, glow * 0.35);
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(e.x - arm, e.y);
        ctx.lineTo(e.x + arm, e.y);
        ctx.moveTo(e.x, e.y - arm);
        ctx.lineTo(e.x, e.y + arm);
        ctx.stroke();
      }
    },
  };
}
