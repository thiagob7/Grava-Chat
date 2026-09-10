import { corDoTema, entre, tinta } from "~/features/tema/lib/fundos/comum";
import type { Motor } from "~/features/tema/lib/fundos/tipos";

/*
  Fitas de cetim atravessando a tela.

  Cada fita é uma faixa entre duas curvas: a linha de cima e a de baixo, com
  larguras diferentes ao longo do caminho. É a largura variando que dá a
  torção — fita de largura fixa lê como cano.

  A luz é um segundo traço mais claro correndo pela metade de cima, que é
  onde a fita pegaria luz se fosse pano de verdade.
*/
const QUANTAS = 5;

interface Fita {
  altura: number;
  amplitude: number;
  largura: number;
  ritmo: number;
  fase: number;
  cor: number[];
  alfa: number;
}

export function fitas(): Motor {
  let relogio = 0;
  let tiras: Fita[] = [];

  const paleta = [
    corDoTema("--color-brand", [190, 120, 255]),
    corDoTema("--color-link", [110, 200, 255]),
    corDoTema("--color-everyone", [255, 130, 190]),
  ];

  const semear = () => {
    tiras = Array.from({ length: QUANTAS }, (_, i) => ({
      altura: 0.16 + (i / QUANTAS) * 0.68 + entre(-0.04, 0.04),
      amplitude: entre(0.05, 0.13),
      largura: entre(26, 62),
      ritmo: entre(0.1, 0.24) * (Math.random() < 0.5 ? -1 : 1),
      fase: entre(0, Math.PI * 2),
      cor: paleta[i % paleta.length]!,
      alfa: entre(0.1, 0.2),
    }));
  };

  return {
    redimensionou: semear,

    quadro: ({ contexto: ctx, largura, altura }, passo) => {
      if (!tiras.length) semear();

      ctx.clearRect(0, 0, largura, altura);
      relogio += passo;
      ctx.globalCompositeOperation = "lighter";

      for (const f of tiras) {
        const base = altura * f.altura;
        const amp = altura * f.amplitude;
        const anda = relogio * f.ritmo + f.fase;

        const linha = (x: number) => {
          const u = x / largura;
          return (
            base +
            Math.sin(u * 4.2 + anda) * amp +
            Math.sin(u * 9.1 - anda * 1.7) * amp * 0.26
          );
        };

        const grossura = (x: number) => {
          const u = x / largura;
          return f.largura * (0.35 + 0.65 * Math.abs(Math.sin(u * 2.6 + anda * 1.3)));
        };

        ctx.beginPath();

        for (let x = -20; x <= largura + 20; x += 14) {
          const y = linha(x) - grossura(x) / 2;
          if (x === -20) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        for (let x = largura + 20; x >= -20; x -= 14) {
          ctx.lineTo(x, linha(x) + grossura(x) / 2);
        }

        ctx.closePath();
        ctx.fillStyle = tinta(f.cor, f.alfa);
        ctx.fill();

        ctx.beginPath();

        for (let x = -20; x <= largura + 20; x += 14) {
          const y = linha(x) - grossura(x) * 0.28;
          if (x === -20) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.strokeStyle = tinta(f.cor, f.alfa * 1.5);
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }

      ctx.globalCompositeOperation = "source-over";
    },
  };
}
