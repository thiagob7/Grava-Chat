import { corDoTema, entre, escolher, tinta } from "~/features/tema/lib/fundos/comum";
import type { Motor } from "~/features/tema/lib/fundos/tipos";

/*
  Corredores que se desenham sozinhos.

  Uns poucos caminhantes andam sobre uma grade, virando às vezes, deixando
  o traço para trás. O rastro não é guardado: a tela é apagada com um preto
  quase transparente por quadro, e o corredor some devagar atrás de quem
  passou. Guardar o traço encheria a tela em meio minuto.

  O caminhante morre ao sair da tela e nasce outro na borda. Sem isso todos
  acabam num canto e o desenho para.
*/
const GRADE = 26;
const PASSOS_POR_SEGUNDO = 13;
const QUANTOS = 5;

const RUMOS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

interface Caminhante {
  x: number;
  y: number;
  rumo: readonly [number, number];
  brilho: number;
}

export function labirinto(): Motor {
  let andantes: Caminhante[] = [];
  let sobra = 0;
  const cor = corDoTema("--color-brand", [120, 200, 255]);

  const nascer = (largura: number, altura: number): Caminhante => ({
    x: Math.round(entre(0, largura / GRADE)) * GRADE,
    y: Math.round(entre(0, altura / GRADE)) * GRADE,
    rumo: escolher(RUMOS),
    brilho: entre(0.5, 1),
  });

  return {
    redimensionou: () => {
      andantes = [];
    },

    quadro: ({ contexto: ctx, largura, altura }, passo) => {
      if (!andantes.length) {
        andantes = Array.from({ length: QUANTOS }, () => nascer(largura, altura));
      }

      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0, 0, 0, 0.022)";
      ctx.fillRect(0, 0, largura, altura);
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "square";

      sobra += passo * PASSOS_POR_SEGUNDO;

      while (sobra >= 1) {
        sobra -= 1;

        for (let i = 0; i < andantes.length; i++) {
          const a = andantes[i]!;
          const deX = a.x;
          const deY = a.y;

          /*
            Vira em quatro de cada dez passos, e nunca para trás: dar meia
            volta deixaria o traço em cima do que acabou de sair, e o
            corredor pisca em vez de crescer.
          */
          if (Math.random() < 0.4) {
            const perpendicular = RUMOS.filter(
              (r) => r[0] !== -a.rumo[0] || r[1] !== -a.rumo[1],
            ).filter((r) => r[0] !== a.rumo[0] || r[1] !== a.rumo[1]);

            a.rumo = escolher(perpendicular);
          }

          a.x += a.rumo[0] * GRADE;
          a.y += a.rumo[1] * GRADE;

          ctx.strokeStyle = tinta(cor, 0.5 * a.brilho);
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(deX, deY);
          ctx.lineTo(a.x, a.y);
          ctx.stroke();

          ctx.fillStyle = tinta(cor, 0.9 * a.brilho);
          ctx.beginPath();
          ctx.arc(a.x, a.y, 1.8, 0, Math.PI * 2);
          ctx.fill();

          const fora =
            a.x < -GRADE || a.y < -GRADE || a.x > largura + GRADE || a.y > altura + GRADE;

          if (fora) andantes[i] = nascer(largura, altura);
        }
      }

      ctx.globalCompositeOperation = "source-over";
    },
  };
}
