import { themeColor, between, tinta } from "~/features/tema/lib/fundos/comum";
import type { Motor } from "~/features/tema/lib/fundos/tipos";

/*
  Colmeia com pulsos de luz.

  A grade fica sempre lá, quase invisível. De tempo em tempo nasce um pulso
  num favo qualquer e ele se afasta em anel, acendendo o contorno de quem
  atravessa. É a grade que dá o desenho e o pulso que dá a vida — grade
  parada é papel de parede, e pulso sem grade é borrão.
*/
const SIDE = 34;
const SPEED = 190;
const THICKNESS = 130;

interface Pulse {
  x: number;
  y: number;
  radius: number;
  force: number;
}

export function combs(): Motor {
  let clock = 0;
  let next = 0.2;
  let pulses: Pulse[] = [];
  const color = themeColor("--color-brand", [110, 200, 180]);

  const drawComb = (ctx: CanvasRenderingContext2D, cx: number, cy: number) => {
    ctx.beginPath();

    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i + Math.PI / 6;
      const px = cx + Math.cos(a) * SIDE;
      const py = cy + Math.sin(a) * SIDE;

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }

    ctx.closePath();
  };

  return {
    frame: ({ context: ctx, width, height }, step) => {
      ctx.clearRect(0, 0, width, height);
      clock += step;
      next -= step;

      if (next <= 0) {
        pulses.push({ x: between(0, width), y: between(0, height), radius: 0, force: 1 });
        next = between(0.7, 1.7);
      }

      pulses = pulses.filter((p) => {
        p.radius += SPEED * step;
        p.force -= step * 0.42;
        return p.force > 0;
      });

      const stepX = SIDE * 1.5;
      const stepY = SIDE * Math.sqrt(3);
      const columns = Math.ceil(width / stepX) + 2;
      const lines = Math.ceil(height / stepY) + 2;

      ctx.lineWidth = 1;

      for (let c = -1; c < columns; c++) {
        for (let l = -1; l < lines; l++) {
          const cx = c * stepX;
          const cy = l * stepY + (c % 2 ? stepY / 2 : 0);

          let lit = 0;

          for (const p of pulses) {
            const d = Math.hypot(cx - p.x, cy - p.y);
            const near = 1 - Math.min(Math.abs(d - p.radius) / THICKNESS, 1);
            lit = Math.max(lit, near * near * p.force);
          }

          drawComb(ctx, cx, cy);
          ctx.strokeStyle = tinta(color, 0.085 + lit * 0.7);
          ctx.stroke();

          if (lit <= 0.45) continue;

          ctx.fillStyle = tinta(color, (lit - 0.45) * 0.22);
          ctx.fill();
        }
      }
    },
  };
}
