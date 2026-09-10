import { corDoTema, entre, tinta } from "~/features/tema/lib/fundos/comum";
import type { Motor } from "~/features/tema/lib/fundos/tipos";

/*
  Neve com profundidade.

  O que faz neve parecer neve não é o floco, é a distância entre eles: o que
  está perto é grande, rápido e desfocado; o que está longe é um pontinho
  quase parado. Uma camada só de flocos iguais lê como chuvisco.

  O vento é uma senoide lenta com duas frequências, para a rajada não bater
  no mesmo compasso o tempo todo.
*/
const CAMADAS = [
  { quantos: 90, raio: [0.7, 1.4], queda: [14, 26], alfa: [0.3, 0.5], deriva: 8 },
  { quantos: 55, raio: [1.4, 2.4], queda: [26, 44], alfa: [0.5, 0.75], deriva: 16 },
  { quantos: 26, raio: [2.4, 4.2], queda: [44, 70], alfa: [0.7, 0.95], deriva: 26 },
];

interface Floco {
  x: number;
  y: number;
  raio: number;
  queda: number;
  alfa: number;
  deriva: number;
  fase: number;
}

export function neve(): Motor {
  let flocos: Floco[] = [];
  let relogio = 0;
  const cor = corDoTema("--color-brilho", [255, 255, 255]);

  const semear = (largura: number, altura: number) => {
    flocos = CAMADAS.flatMap((camada) =>
      Array.from({ length: camada.quantos }, () => ({
        x: entre(0, largura),
        y: entre(0, altura),
        raio: entre(camada.raio[0]!, camada.raio[1]!),
        queda: entre(camada.queda[0]!, camada.queda[1]!),
        alfa: entre(camada.alfa[0]!, camada.alfa[1]!),
        deriva: camada.deriva,
        fase: entre(0, Math.PI * 2),
      })),
    );
  };

  return {
    redimensionou: (palco) => semear(palco.largura, palco.altura),

    quadro: ({ contexto: ctx, largura, altura }, passo) => {
      if (!flocos.length) semear(largura, altura);

      ctx.clearRect(0, 0, largura, altura);
      relogio += passo;

      const rajada = Math.sin(relogio * 0.24) * 0.7 + Math.sin(relogio * 0.09) * 0.3;

      for (const f of flocos) {
        f.y += f.queda * passo;
        f.x += (rajada * f.deriva + Math.sin(relogio * 0.8 + f.fase) * f.deriva * 0.4) * passo;

        if (f.y - f.raio > altura) {
          f.y = -f.raio;
          f.x = entre(0, largura);
        }

        if (f.x < -8) f.x = largura + 8;
        else if (f.x > largura + 8) f.x = -8;

        ctx.beginPath();
        ctx.fillStyle = tinta(cor, f.alfa);
        ctx.arc(f.x, f.y, f.raio, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  };
}
