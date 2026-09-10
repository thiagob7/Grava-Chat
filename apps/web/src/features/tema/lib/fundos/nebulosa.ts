import { corDoTema, entre, tinta } from "~/features/tema/lib/fundos/comum";
import type { Motor } from "~/features/tema/lib/fundos/tipos";

/*
  Nuvens de cor que se atravessam.

  Cada nuvem é um gradiente radial grande andando numa elipse própria, e o
  desenho é somado com `lighter`: onde duas se cruzam nasce uma terceira cor
  que ninguém escolheu. É isso que separa uma nebulosa de três manchas
  paradas num degradê.

  As cores saem do próprio tema, então o mesmo motor serve a uma nebulosa
  roxa e a uma verde sem virar efeito genérico.
*/
interface Nuvem {
  raio: number;
  cor: number[];
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  volta: number;
  fase: number;
  pulso: number;
  forca: number;
}

export function nebulosa(): Motor {
  let nuvens: Nuvem[] = [];
  let relogio = 0;

  const paleta = [
    corDoTema("--color-brand", [126, 63, 255]),
    corDoTema("--color-link", [0, 174, 255]),
    corDoTema("--color-everyone", [255, 60, 170]),
  ];

  const semear = (largura: number, altura: number) => {
    const medida = Math.max(largura, altura);

    /*
      Tamanhos bem diferentes, de propósito. Seis nuvens da mesma medida no
      meio da tela somam num borrão só, que foi exatamente o que aconteceu
      na primeira tentativa. As grandes dão o clima, as pequenas dão o
      desenho — e são elas que fazem o olho achar profundidade.
    */
    const medidas = [0.46, 0.38, 0.3, 0.22, 0.17, 0.13, 0.1, 0.08];

    nuvens = medidas.map((m, i) => ({
      raio: medida * m * entre(0.85, 1.15),
      cor: paleta[i % paleta.length]!,
      cx: entre(0.05, 0.95),
      cy: entre(0.08, 0.92),
      rx: entre(0.05, 0.2),
      ry: entre(0.04, 0.16),
      volta: entre(20, 68) * (Math.random() < 0.5 ? -1 : 1),
      fase: entre(0, Math.PI * 2),
      pulso: entre(0.05, 0.15),
      /* A pequena é mais densa: nuvem que some de perto não é nuvem. */
      forca: 0.1 + (1 - m) * 0.24,
    }));
  };

  return {
    redimensionou: (palco) => semear(palco.largura, palco.altura),

    quadro: ({ contexto: ctx, largura, altura }, passo) => {
      if (!nuvens.length) semear(largura, altura);

      ctx.clearRect(0, 0, largura, altura);
      relogio += passo;
      ctx.globalCompositeOperation = "lighter";

      for (const n of nuvens) {
        const angulo = (relogio / n.volta) * Math.PI * 2 + n.fase;
        const x = (n.cx + Math.cos(angulo) * n.rx) * largura;
        const y = (n.cy + Math.sin(angulo) * n.ry) * altura;
        const forca = n.forca * (0.78 + 0.22 * Math.sin(relogio * n.pulso + n.fase));

        const pincel = ctx.createRadialGradient(x, y, 0, x, y, n.raio);
        pincel.addColorStop(0, tinta(n.cor, forca));
        pincel.addColorStop(0.55, tinta(n.cor, forca * 0.32));
        pincel.addColorStop(1, tinta(n.cor, 0));

        ctx.fillStyle = pincel;
        ctx.beginPath();
        ctx.arc(x, y, n.raio, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
    },
  };
}
