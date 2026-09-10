import { corDoTema, entre, tinta } from "~/features/tema/lib/fundos/comum";
import type { Motor } from "~/features/tema/lib/fundos/tipos";

/*
  Colmeia com pulsos de luz.

  A grade fica sempre lá, quase invisível. De tempo em tempo nasce um pulso
  num favo qualquer e ele se afasta em anel, acendendo o contorno de quem
  atravessa. É a grade que dá o desenho e o pulso que dá a vida — grade
  parada é papel de parede, e pulso sem grade é borrão.
*/
const LADO = 34;
const VELOCIDADE = 190;
const ESPESSURA = 130;

interface Pulso {
  x: number;
  y: number;
  raio: number;
  forca: number;
}

export function favos(): Motor {
  let relogio = 0;
  let proximo = 0.2;
  let pulsos: Pulso[] = [];
  const cor = corDoTema("--color-brand", [110, 200, 180]);

  const desenharFavo = (ctx: CanvasRenderingContext2D, cx: number, cy: number) => {
    ctx.beginPath();

    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i + Math.PI / 6;
      const px = cx + Math.cos(a) * LADO;
      const py = cy + Math.sin(a) * LADO;

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }

    ctx.closePath();
  };

  return {
    quadro: ({ contexto: ctx, largura, altura }, passo) => {
      ctx.clearRect(0, 0, largura, altura);
      relogio += passo;
      proximo -= passo;

      if (proximo <= 0) {
        pulsos.push({ x: entre(0, largura), y: entre(0, altura), raio: 0, forca: 1 });
        proximo = entre(0.7, 1.7);
      }

      pulsos = pulsos.filter((p) => {
        p.raio += VELOCIDADE * passo;
        p.forca -= passo * 0.42;
        return p.forca > 0;
      });

      const passoX = LADO * 1.5;
      const passoY = LADO * Math.sqrt(3);
      const colunas = Math.ceil(largura / passoX) + 2;
      const linhas = Math.ceil(altura / passoY) + 2;

      ctx.lineWidth = 1;

      for (let c = -1; c < colunas; c++) {
        for (let l = -1; l < linhas; l++) {
          const cx = c * passoX;
          const cy = l * passoY + (c % 2 ? passoY / 2 : 0);

          let aceso = 0;

          for (const p of pulsos) {
            const d = Math.hypot(cx - p.x, cy - p.y);
            const perto = 1 - Math.min(Math.abs(d - p.raio) / ESPESSURA, 1);
            aceso = Math.max(aceso, perto * perto * p.forca);
          }

          desenharFavo(ctx, cx, cy);
          ctx.strokeStyle = tinta(cor, 0.085 + aceso * 0.7);
          ctx.stroke();

          if (aceso <= 0.45) continue;

          ctx.fillStyle = tinta(cor, (aceso - 0.45) * 0.22);
          ctx.fill();
        }
      }
    },
  };
}
