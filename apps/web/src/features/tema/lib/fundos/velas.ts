import { themeColor, between, tinta } from "~/features/tema/lib/fundos/comum";
import type { Motor } from "~/features/tema/lib/fundos/tipos";

/*
  Velas boiando no ar, como as de um salão alto.

  O truque está na chama, não na vela: ela tem duas partes, um miolo quase
  branco e um halo largo e quente, e as duas tremem em ritmos diferentes.
  Tremida única deixa a chama com cara de gif.

  Cada vela também sobe e desce no seu próprio compasso, devagar. Vela
  parada no ar lê como adesivo colado na tela.
*/
interface Vela {
  x: number;
  y: number;
  scale: number;
  phase: number;
  pace: number;
  balance: number;
  shaky: number;
}

export function candles(): Motor {
  let lit: Vela[] = [];
  let clock = 0;
  const calls = themeColor("--color-brand", [255, 186, 92]);
  const wax = themeColor("--color-ink", [238, 230, 210]);

  const seed = (width: number, height: number) => {
    const count = Math.max(9, Math.round(width / 150));

    lit = Array.from({ length: count }, () => {
      const background = Math.random();

      return {
        x: between(0.04, 0.96) * width,
        y: between(0.06, 0.72) * height,
        scale: 0.45 + background * 0.85,
        phase: between(0, Math.PI * 2),
        pace: between(0.18, 0.4),
        balance: between(8, 22),
        shaky: between(4, 9),
      };
    });
  };

  return {
    resized: (stage) => seed(stage.width, stage.height),

    frame: ({ context: ctx, width, height }, step) => {
      if (!lit.length) seed(width, height);

      ctx.clearRect(0, 0, width, height);
      clock += step;

      for (const v of lit) {
        const y = v.y + Math.sin(clock * v.pace + v.phase) * v.balance;
        const dance =
          0.82 +
          0.12 * Math.sin(clock * v.shaky + v.phase) +
          0.06 * Math.sin(clock * v.shaky * 2.7 + v.phase * 1.6);

        const body = 26 * v.scale;
        const largo = 6.5 * v.scale;

        ctx.globalCompositeOperation = "lighter";

        const halo = ctx.createRadialGradient(v.x, y, 0, v.x, y, 78 * v.scale * dance);
        halo.addColorStop(0, tinta(calls, 0.3));
        halo.addColorStop(0.4, tinta(calls, 0.09));
        halo.addColorStop(1, tinta(calls, 0));
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(v.x, y, 78 * v.scale * dance, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalCompositeOperation = "source-over";

        ctx.fillStyle = tinta(wax, 0.5);
        ctx.beginPath();
        ctx.roundRect(v.x - largo / 2, y, largo, body, largo / 2);
        ctx.fill();

        ctx.globalCompositeOperation = "lighter";

        const callsHeight = 13 * v.scale * dance;
        ctx.fillStyle = tinta(calls, 0.85);
        ctx.beginPath();
        ctx.ellipse(v.x, y - callsHeight * 0.45, 3.4 * v.scale, callsHeight * 0.62, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = tinta([255, 250, 232], 0.95);
        ctx.beginPath();
        ctx.ellipse(v.x, y - callsHeight * 0.34, 1.5 * v.scale, callsHeight * 0.34, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalCompositeOperation = "source-over";
      }
    },
  };
}
