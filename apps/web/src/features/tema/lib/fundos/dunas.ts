import { corDoTema, ondular, tinta } from "~/features/tema/lib/fundos/comum";
import type { Motor } from "~/features/tema/lib/fundos/tipos";

/*
  Cristas de duna, uma atrás da outra.

  Cada camada é um recorte cheio, ancorado no rodapé, e a de trás é mais
  clara: é a névoa de distância que dá a profundidade. Sem ela seriam cinco
  silhuetas empilhadas.

  O perfil vem de ruído somado a uma senoide larga. Só senoide daria colina
  de desenho animado; só ruído daria serra.
*/
const CAMADAS = 7;

export function dunas(): Motor {
  let relogio = 0;
  const perto = corDoTema("--color-surface-3", [58, 44, 30]);
  const longe = corDoTema("--color-brand", [206, 150, 78]);

  return {
    quadro: ({ contexto: ctx, largura, altura }, passo) => {
      ctx.clearRect(0, 0, largura, altura);
      relogio += passo;

      for (let c = CAMADAS - 1; c >= 0; c--) {
        const t = c / (CAMADAS - 1);
        const base = altura * (0.5 + t * 0.56);
        /*
          Duna é longa e rasa. A primeira versão usava um sexto da altura da
          tela por crista e o resultado era serra, não deserto.
        */
        const alto = altura * (0.035 + (1 - t) * 0.03);
        const deslize = relogio * (0.008 + (1 - t) * 0.02);
        const escala = 0.9 + t * 1.3;

        /*
          A crista da frente é a mais escura, e a do fundo some na névoa.
          Estava ao contrário e o deserto ficava com a areia mais clara
          justo onde ela devia ser silhueta.
        */
        const cor = perto.map((v, i) => v + (longe[i]! - v) * t * 0.7);

        ctx.fillStyle = tinta(cor, 0.4 - t * 0.26);
        ctx.beginPath();
        ctx.moveTo(-10, altura + 10);

        for (let x = -10; x <= largura + 10; x += 9) {
          const u = (x / largura) * escala + deslize;
          const y =
            base -
            (ondular(u * 3) - 0.5) * alto * 2 -
            Math.sin(u * 2.1 + c) * alto * 0.6;

          ctx.lineTo(x, y);
        }

        ctx.lineTo(largura + 10, altura + 10);
        ctx.closePath();
        ctx.fill();
      }
    },
  };
}
