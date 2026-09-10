import { corDoTema, entre, tinta } from "~/features/tema/lib/fundos/comum";
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
  escala: number;
  fase: number;
  ritmo: number;
  balanco: number;
  tremida: number;
}

export function velas(): Motor {
  let acesas: Vela[] = [];
  let relogio = 0;
  const chama = corDoTema("--color-brand", [255, 186, 92]);
  const cera = corDoTema("--color-ink", [238, 230, 210]);

  const semear = (largura: number, altura: number) => {
    const quantas = Math.max(9, Math.round(largura / 150));

    acesas = Array.from({ length: quantas }, () => {
      const fundo = Math.random();

      return {
        x: entre(0.04, 0.96) * largura,
        y: entre(0.06, 0.72) * altura,
        escala: 0.45 + fundo * 0.85,
        fase: entre(0, Math.PI * 2),
        ritmo: entre(0.18, 0.4),
        balanco: entre(8, 22),
        tremida: entre(4, 9),
      };
    });
  };

  return {
    redimensionou: (palco) => semear(palco.largura, palco.altura),

    quadro: ({ contexto: ctx, largura, altura }, passo) => {
      if (!acesas.length) semear(largura, altura);

      ctx.clearRect(0, 0, largura, altura);
      relogio += passo;

      for (const v of acesas) {
        const y = v.y + Math.sin(relogio * v.ritmo + v.fase) * v.balanco;
        const dança =
          0.82 +
          0.12 * Math.sin(relogio * v.tremida + v.fase) +
          0.06 * Math.sin(relogio * v.tremida * 2.7 + v.fase * 1.6);

        const corpo = 26 * v.escala;
        const largo = 6.5 * v.escala;

        ctx.globalCompositeOperation = "lighter";

        const halo = ctx.createRadialGradient(v.x, y, 0, v.x, y, 78 * v.escala * dança);
        halo.addColorStop(0, tinta(chama, 0.3));
        halo.addColorStop(0.4, tinta(chama, 0.09));
        halo.addColorStop(1, tinta(chama, 0));
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(v.x, y, 78 * v.escala * dança, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalCompositeOperation = "source-over";

        ctx.fillStyle = tinta(cera, 0.5);
        ctx.beginPath();
        ctx.roundRect(v.x - largo / 2, y, largo, corpo, largo / 2);
        ctx.fill();

        ctx.globalCompositeOperation = "lighter";

        const alturaDaChama = 13 * v.escala * dança;
        ctx.fillStyle = tinta(chama, 0.85);
        ctx.beginPath();
        ctx.ellipse(v.x, y - alturaDaChama * 0.45, 3.4 * v.escala, alturaDaChama * 0.62, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = tinta([255, 250, 232], 0.95);
        ctx.beginPath();
        ctx.ellipse(v.x, y - alturaDaChama * 0.34, 1.5 * v.escala, alturaDaChama * 0.34, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalCompositeOperation = "source-over";
      }
    },
  };
}
