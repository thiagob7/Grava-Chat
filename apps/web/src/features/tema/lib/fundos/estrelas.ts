import { corDoTema, entre, tinta } from "~/features/tema/lib/fundos/comum";
import type { Motor } from "~/features/tema/lib/fundos/tipos";

/*
  Campo de estrelas com paralaxe.

  Três profundidades andando em velocidades diferentes na diagonal. O que
  vende o céu é a minoria: umas poucas estrelas ganham uma cruz de luz e
  piscam fora de compasso. Todas piscando junto vira pisca-pisca de natal.
*/
interface Estrela {
  x: number;
  y: number;
  raio: number;
  alfa: number;
  passo: number;
  cintila: number;
  fase: number;
  cruz: boolean;
}

export function estrelas(): Motor {
  let campo: Estrela[] = [];
  let relogio = 0;
  const cor = corDoTema("--color-brilho", [220, 228, 255]);

  const semear = (largura: number, altura: number) => {
    const quantas = Math.round((largura * altura) / 5200);

    campo = Array.from({ length: quantas }, () => {
      const fundo = Math.random();

      return {
        x: entre(0, largura),
        y: entre(0, altura),
        raio: 0.5 + fundo * 1.5,
        alfa: 0.25 + fundo * 0.6,
        passo: 1.5 + fundo * 7,
        cintila: Math.random() < 0.3 ? entre(0.6, 1.8) : 0,
        fase: entre(0, Math.PI * 2),
        cruz: fundo > 0.88,
      };
    });
  };

  return {
    redimensionou: (palco) => semear(palco.largura, palco.altura),

    quadro: ({ contexto: ctx, largura, altura }, passo) => {
      if (!campo.length) semear(largura, altura);

      ctx.clearRect(0, 0, largura, altura);
      relogio += passo;

      for (const e of campo) {
        e.x += e.passo * passo * 0.35;
        e.y += e.passo * passo * 0.14;

        if (e.x > largura + 2) e.x = -2;
        if (e.y > altura + 2) e.y = -2;

        const brilho = e.cintila
          ? e.alfa * (0.55 + 0.45 * Math.sin(relogio * e.cintila + e.fase))
          : e.alfa;

        ctx.beginPath();
        ctx.fillStyle = tinta(cor, brilho);
        ctx.arc(e.x, e.y, e.raio, 0, Math.PI * 2);
        ctx.fill();

        if (!e.cruz) continue;

        const braco = e.raio * 5;
        ctx.strokeStyle = tinta(cor, brilho * 0.35);
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(e.x - braco, e.y);
        ctx.lineTo(e.x + braco, e.y);
        ctx.moveTo(e.x, e.y - braco);
        ctx.lineTo(e.x, e.y + braco);
        ctx.stroke();
      }
    },
  };
}
