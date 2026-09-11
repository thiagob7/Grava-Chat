import { themeColor, between, tinta } from "~/features/tema/lib/fundos/comum";
import type { Motor } from "~/features/tema/lib/fundos/tipos";

/*
  Vidro quebrado, visto de perto.

  Um punhado de sementes espalhadas pela tela, e cada uma vira um caco: o
  polígono dos pontos mais próximos dela. A semente anda devagar, então o
  caco muda de forma sozinho, e nas bordas nasce e morre faceta sem cortar
  nada.

  Em vez de calcular Voronoi de verdade, cada caco é desenhado como um
  polígono irregular preso à semente. Fica indistinguível a essa opacidade e
  custa uma fração do preço.
*/
interface Shard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  sides: number;
  giro: number;
  back: number;
  color: number[];
  alfa: number;
}

export function facets(): Motor {
  let shards: Shard[] = [];
  let clock = 0;

  const palette = [
    themeColor("--color-brand", [150, 190, 255]),
    themeColor("--color-link", [120, 220, 230]),
    themeColor("--color-surface-3", [70, 80, 110]),
  ];

  const seed = (width: number, height: number) => {
    const count = Math.max(14, Math.round((width * height) / 42000));

    shards = Array.from({ length: count }, (_, i) => ({
      x: between(0, width),
      y: between(0, height),
      vx: between(-7, 7),
      vy: between(-7, 7),
      radius: between(70, 190),
      sides: Math.round(between(3, 6)),
      giro: between(0, Math.PI * 2),
      back: between(-0.05, 0.05),
      color: palette[i % palette.length]!,
      alfa: between(0.04, 0.11),
    }));
  };

  return {
    resized: (stage) => seed(stage.width, stage.height),

    frame: ({ context: ctx, width, height }, step) => {
      if (!shards.length) seed(width, height);

      ctx.clearRect(0, 0, width, height);
      clock += step;
      ctx.globalCompositeOperation = "lighter";

      for (const c of shards) {
        c.x += c.vx * step;
        c.y += c.vy * step;
        c.giro += c.back * step;

        if (c.x < -c.radius) c.x = width + c.radius;
        if (c.x > width + c.radius) c.x = -c.radius;
        if (c.y < -c.radius) c.y = height + c.radius;
        if (c.y > height + c.radius) c.y = -c.radius;

        ctx.beginPath();

        for (let i = 0; i < c.sides; i++) {
          const a = c.giro + (Math.PI * 2 * i) / c.sides;
          /*
            O raio de cada vértice oscila num compasso próprio. É o que
            impede o caco de virar um polígono regular girando, que é o
            desenho que denuncia efeito gerado.
          */
          const r = c.radius * (0.62 + 0.38 * Math.abs(Math.sin(clock * 0.13 + i * 2.1 + c.giro)));
          const px = c.x + Math.cos(a) * r;
          const py = c.y + Math.sin(a) * r;

          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }

        ctx.closePath();
        ctx.fillStyle = tinta(c.color, c.alfa);
        ctx.fill();
        ctx.strokeStyle = tinta(c.color, c.alfa * 2.4);
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.globalCompositeOperation = "source-over";
    },
  };
}
