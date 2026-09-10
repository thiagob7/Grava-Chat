import { corDoTema, entre, tinta } from "~/features/tema/lib/fundos/comum";
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
interface Caco {
  x: number;
  y: number;
  vx: number;
  vy: number;
  raio: number;
  lados: number;
  giro: number;
  volta: number;
  cor: number[];
  alfa: number;
}

export function facetas(): Motor {
  let cacos: Caco[] = [];
  let relogio = 0;

  const paleta = [
    corDoTema("--color-brand", [150, 190, 255]),
    corDoTema("--color-link", [120, 220, 230]),
    corDoTema("--color-surface-3", [70, 80, 110]),
  ];

  const semear = (largura: number, altura: number) => {
    const quantos = Math.max(14, Math.round((largura * altura) / 42000));

    cacos = Array.from({ length: quantos }, (_, i) => ({
      x: entre(0, largura),
      y: entre(0, altura),
      vx: entre(-7, 7),
      vy: entre(-7, 7),
      raio: entre(70, 190),
      lados: Math.round(entre(3, 6)),
      giro: entre(0, Math.PI * 2),
      volta: entre(-0.05, 0.05),
      cor: paleta[i % paleta.length]!,
      alfa: entre(0.04, 0.11),
    }));
  };

  return {
    redimensionou: (palco) => semear(palco.largura, palco.altura),

    quadro: ({ contexto: ctx, largura, altura }, passo) => {
      if (!cacos.length) semear(largura, altura);

      ctx.clearRect(0, 0, largura, altura);
      relogio += passo;
      ctx.globalCompositeOperation = "lighter";

      for (const c of cacos) {
        c.x += c.vx * passo;
        c.y += c.vy * passo;
        c.giro += c.volta * passo;

        if (c.x < -c.raio) c.x = largura + c.raio;
        if (c.x > largura + c.raio) c.x = -c.raio;
        if (c.y < -c.raio) c.y = altura + c.raio;
        if (c.y > altura + c.raio) c.y = -c.raio;

        ctx.beginPath();

        for (let i = 0; i < c.lados; i++) {
          const a = c.giro + (Math.PI * 2 * i) / c.lados;
          /*
            O raio de cada vértice oscila num compasso próprio. É o que
            impede o caco de virar um polígono regular girando, que é o
            desenho que denuncia efeito gerado.
          */
          const r = c.raio * (0.62 + 0.38 * Math.abs(Math.sin(relogio * 0.13 + i * 2.1 + c.giro)));
          const px = c.x + Math.cos(a) * r;
          const py = c.y + Math.sin(a) * r;

          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }

        ctx.closePath();
        ctx.fillStyle = tinta(c.cor, c.alfa);
        ctx.fill();
        ctx.strokeStyle = tinta(c.cor, c.alfa * 2.4);
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.globalCompositeOperation = "source-over";
    },
  };
}
