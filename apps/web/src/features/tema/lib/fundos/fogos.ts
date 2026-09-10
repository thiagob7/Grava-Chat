import type { Motor, Palco } from "~/features/tema/lib/fundos/tipos";

/*
  Fogos com física, em canvas.

  As três versões anteriores deste efeito foram feitas com `box-shadow` no
  CSS, e o teto ficou claro: sombra não cai, não tem atrito e não some uma
  antes da outra. O que faltava era simular, não desenhar.

  Cada foguete sobe perdendo velocidade, abre num número de faíscas e cada
  faísca vira um ponto com gravidade e arrasto próprios. O rastro não é
  desenhado: a tela é apagada com um preto quase transparente a cada quadro,
  e o que sobra do quadro anterior é o rastro.
*/
const GRAVIDADE = 46;
/*
  Arrasto por quadro a 60 Hz. Começou em 0.86 e o estouro virava um bolinho:
  a essa taxa a faísca perde a velocidade em meio segundo e anda quinze
  pixels. O ar segura a brasa, não freia ela.
*/
const ARRASTO = 0.985;
const ESPERA = [0.7, 1.9];

const PALETA = [
  [255, 206, 110],
  [255, 152, 64],
  [150, 196, 255],
  [255, 130, 186],
  [180, 255, 208],
  [214, 176, 255],
];

interface Ponto {
  x: number;
  y: number;
  vx: number;
  vy: number;
  vida: number;
  total: number;
  cor: number[];
  brilho: number;
}

interface Foguete {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alvo: number;
  cor: number[];
}

/*
  Cada faísca é desenhada como o segmento entre onde ela estava e onde ela
  está, não como um ponto. Ponto sai pontilhado assim que o quadro atrasa ou
  a faísca corre; o segmento é o próprio borrão de movimento, e sai certo em
  qualquer taxa de quadro.
*/
function risco(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  paraX: number,
  paraY: number,
  cor: number[],
  alfa: number,
  grossura: number,
) {
  const tinta = `${cor[0]} ${cor[1]} ${cor[2]}`;

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(paraX, paraY);

  /*
    Duas passadas no mesmo traço: uma larga e fraca, que é o halo, e a fina
    por cima, que é a faísca. O fundo do app é translúcido e come metade do
    brilho, então sem o halo a faísca chega apagada do outro lado do vidro.
  */
  ctx.strokeStyle = `rgb(${tinta} / ${alfa * 0.22})`;
  ctx.lineWidth = grossura * 3.2;
  ctx.stroke();

  ctx.strokeStyle = `rgb(${tinta} / ${alfa})`;
  ctx.lineWidth = grossura;
  ctx.stroke();
}

const entre = (a: number, b: number) => a + Math.random() * (b - a);

export function fogos(): Motor {
  let foguetes: Foguete[] = [];
  let faiscas: Ponto[] = [];
  let proximo = 0.6;

  const lancar = (palco: Palco, x?: number, y?: number) => {
    const saida = x ?? entre(palco.largura * 0.15, palco.largura * 0.85);
    const topo = y ?? entre(palco.altura * 0.12, palco.altura * 0.46);

    foguetes.push({
      x: saida,
      y: palco.altura + 12,
      vx: entre(-14, 14),
      vy: -entre(340, 430),
      alvo: topo,
      cor: PALETA[Math.floor(Math.random() * PALETA.length)]!,
    });
  };

  const abrir = (foguete: Foguete) => {
    const quantas = Math.round(entre(84, 128));
    const forca = entre(130, 240);
    const anel = Math.random() < 0.45;

    for (let i = 0; i < quantas; i++) {
      const angulo = (i / quantas) * Math.PI * 2 + entre(-0.05, 0.05);
      /*
        Metade dos estouros é anel, metade é bola. O anel tem todas as
        faíscas na mesma velocidade e abre uma casca limpa; a bola sorteia,
        e sai mais cheia no miolo. Só anel deixa o céu repetitivo.
      */
      const velocidade = anel ? forca * entre(0.92, 1.06) : forca * Math.sqrt(Math.random());
      const vida = entre(1.3, 2.4);

      faiscas.push({
        x: foguete.x,
        y: foguete.y,
        vx: Math.cos(angulo) * velocidade,
        vy: Math.sin(angulo) * velocidade,
        vida,
        total: vida,
        cor: foguete.cor,
        brilho: entre(0.7, 1),
      });
    }
  };

  return {
    clicou: (palco, x, y) => lancar(palco, x, y),

    quadro: (palco, passo) => {
      const { contexto: ctx, largura, altura } = palco;

      /*
        O rastro. Apagar com preto translúcido em vez de limpar a tela deixa
        o quadro anterior desbotando por baixo do novo, que é o que dá a
        cauda das faíscas de graça.
      */
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0, 0, 0, 0.11)";
      ctx.fillRect(0, 0, largura, altura);
      ctx.globalCompositeOperation = "lighter";

      proximo -= passo;
      if (proximo <= 0) {
        lancar(palco);
        proximo = entre(ESPERA[0]!, ESPERA[1]!);
      }

      ctx.lineCap = "round";

      foguetes = foguetes.filter((f) => {
        const deX = f.x;
        const deY = f.y;

        f.vy += GRAVIDADE * passo * 3;
        f.x += f.vx * passo;
        f.y += f.vy * passo;

        if (f.y <= f.alvo || f.vy >= -40) {
          abrir(f);
          return false;
        }

        risco(ctx, deX, deY, f.x, f.y, [255, 240, 200], 0.9, 2);
        return true;
      });

      faiscas = faiscas.filter((p) => {
        p.vida -= passo;
        if (p.vida <= 0) return false;

        const deX = p.x;
        const deY = p.y;
        const atrito = ARRASTO ** (passo * 60);

        p.vx *= atrito;
        p.vy = p.vy * atrito + GRAVIDADE * passo;
        p.x += p.vx * passo;
        p.y += p.vy * passo;

        const resto = p.vida / p.total;
        /* Apaga rápido no fim: faísca não some devagar, ela pisca e acaba. */
        const alfa = resto * resto * p.brilho;

        /*
          Recém-aberta a faísca é quase branca, e vai virando a cor do fogo
          conforme esfria. É o que o olho espera de brasa, e é o que separa
          um estouro de um punhado de bolinhas coloridas.
        */
        const quente = resto > 0.82 ? (resto - 0.82) / 0.18 : 0;
        const cor = [
          p.cor[0]! + (255 - p.cor[0]!) * quente,
          p.cor[1]! + (255 - p.cor[1]!) * quente,
          p.cor[2]! + (255 - p.cor[2]!) * quente,
        ];

        risco(ctx, deX, deY, p.x, p.y, cor, alfa, 2.3);
        return true;
      });

      ctx.globalCompositeOperation = "source-over";
    },

    redimensionou: () => {
      foguetes = [];
      faiscas = [];
    },
  };
}
