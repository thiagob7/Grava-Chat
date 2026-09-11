import type { Motor, Stage } from "~/features/tema/lib/fundos/tipos";

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
const GRAVITY = 46;
/*
  Arrasto por quadro a 60 Hz. Começou em 0.86 e o estouro virava um bolinho:
  a essa taxa a faísca perde a velocidade em meio segundo e anda quinze
  pixels. O ar segura a brasa, não freia ela.
*/
const DRAG = 0.985;
const WAIT = [0.7, 1.9];

const PALETTE = [
  [255, 206, 110],
  [255, 152, 64],
  [150, 196, 255],
  [255, 130, 186],
  [180, 255, 208],
  [214, 176, 255],
];

interface Dot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  total: number;
  color: number[];
  glow: number;
}

interface Rocket {
  x: number;
  y: number;
  vx: number;
  vy: number;
  target: number;
  color: number[];
}

/*
  Cada faísca é desenhada como o segmento entre onde ela estava e onde ela
  está, não como um ponto. Ponto sai pontilhado assim que o quadro atrasa ou
  a faísca corre; o segmento é o próprio borrão de movimento, e sai certo em
  qualquer taxa de quadro.
*/
function risk(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  forX: number,
  forY: number,
  color: number[],
  alfa: number,
  thickness: number,
) {
  const tinta = `${color[0]} ${color[1]} ${color[2]}`;

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(forX, forY);

  /*
    Duas passadas no mesmo traço: uma larga e fraca, que é o halo, e a fina
    por cima, que é a faísca. O fundo do app é translúcido e come metade do
    brilho, então sem o halo a faísca chega apagada do outro lado do vidro.
  */
  ctx.strokeStyle = `rgb(${tinta} / ${alfa * 0.22})`;
  ctx.lineWidth = thickness * 3.2;
  ctx.stroke();

  ctx.strokeStyle = `rgb(${tinta} / ${alfa})`;
  ctx.lineWidth = thickness;
  ctx.stroke();
}

const between = (a: number, b: number) => a + Math.random() * (b - a);

export function fires(): Motor {
  let rockets: Rocket[] = [];
  let sparks: Dot[] = [];
  let next = 0.6;

  const launch = (stage: Stage, x?: number, y?: number) => {
    const output = x ?? between(stage.width * 0.15, stage.width * 0.85);
    const top = y ?? between(stage.height * 0.12, stage.height * 0.46);

    rockets.push({
      x: output,
      y: stage.height + 12,
      vx: between(-14, 14),
      vy: -between(340, 430),
      target: top,
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)]!,
    });
  };

  const open = (rocket: Rocket) => {
    const count = Math.round(between(84, 128));
    const force = between(130, 240);
    const ring = Math.random() < 0.45;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + between(-0.05, 0.05);
      /*
        Metade dos estouros é anel, metade é bola. O anel tem todas as
        faíscas na mesma velocidade e abre uma casca limpa; a bola sorteia,
        e sai mais cheia no miolo. Só anel deixa o céu repetitivo.
      */
      const speed = ring ? force * between(0.92, 1.06) : force * Math.sqrt(Math.random());
      const life = between(1.3, 2.4);

      sparks.push({
        x: rocket.x,
        y: rocket.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        total: life,
        color: rocket.color,
        glow: between(0.7, 1),
      });
    }
  };

  return {
    clicked: (stage, x, y) => launch(stage, x, y),

    frame: (stage, step) => {
      const { context: ctx, width, height } = stage;

      /*
        O rastro. Apagar com preto translúcido em vez de limpar a tela deixa
        o quadro anterior desbotando por baixo do novo, que é o que dá a
        cauda das faíscas de graça.
      */
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0, 0, 0, 0.11)";
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      next -= step;
      if (next <= 0) {
        launch(stage);
        next = between(WAIT[0]!, WAIT[1]!);
      }

      ctx.lineCap = "round";

      rockets = rockets.filter((f) => {
        const fromX = f.x;
        const fromY = f.y;

        f.vy += GRAVITY * step * 3;
        f.x += f.vx * step;
        f.y += f.vy * step;

        if (f.y <= f.target || f.vy >= -40) {
          open(f);
          return false;
        }

        risk(ctx, fromX, fromY, f.x, f.y, [255, 240, 200], 0.9, 2);
        return true;
      });

      sparks = sparks.filter((p) => {
        p.life -= step;
        if (p.life <= 0) return false;

        const fromX = p.x;
        const fromY = p.y;
        const friction = DRAG ** (step * 60);

        p.vx *= friction;
        p.vy = p.vy * friction + GRAVITY * step;
        p.x += p.vx * step;
        p.y += p.vy * step;

        const rest = p.life / p.total;
        /* Apaga rápido no fim: faísca não some devagar, ela pisca e acaba. */
        const alfa = rest * rest * p.glow;

        /*
          Recém-aberta a faísca é quase branca, e vai virando a cor do fogo
          conforme esfria. É o que o olho espera de brasa, e é o que separa
          um estouro de um punhado de bolinhas coloridas.
        */
        const hot = rest > 0.82 ? (rest - 0.82) / 0.18 : 0;
        const color = [
          p.color[0]! + (255 - p.color[0]!) * hot,
          p.color[1]! + (255 - p.color[1]!) * hot,
          p.color[2]! + (255 - p.color[2]!) * hot,
        ];

        risk(ctx, fromX, fromY, p.x, p.y, color, alfa, 2.3);
        return true;
      });

      ctx.globalCompositeOperation = "source-over";
    },

    resized: () => {
      rockets = [];
      sparks = [];
    },
  };
}
