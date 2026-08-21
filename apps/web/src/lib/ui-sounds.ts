/**
 * Os bipes da interface: entrar e sair da chamada, mutar, ficar surdo, abrir a
 * live.
 *
 * São SINTETIZADOS, não arquivos. Três motivos: não engordam o bundle (um pacote
 * de .mp3 curtos passa fácil de 100 KB), tocam instantaneamente porque não
 * dependem de download, e continuam funcionando offline no aplicativo de
 * desktop. Um bipe de interface é uma ou duas senoides com envelope — gravar
 * isso num arquivo seria desperdício.
 *
 * O timbre é de propósito o mesmo em todos: subir de tom = algo começou, descer
 * = algo terminou. É o que faz a pessoa entender sem precisar aprender.
 */

/**
 * UM contexto pra tudo. Cada `new AudioContext()` come uma das poucas instâncias
 * que o navegador permite, e criar um por bipe fura o limite depois de algumas
 * dezenas de cliques — os sons simplesmente param, sem erro.
 */
let ctx: AudioContext | null = null;

function contexto(): AudioContext | null {
  try {
    ctx ??= new AudioContext();

    // Navegador suspende o contexto criado antes do primeiro clique da pessoa.
    // Sem isto, o primeiro bipe da sessão sai mudo.
    if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);

    return ctx;
  } catch {
    // sem Web Audio o app inteiro continua funcionando; só fica silencioso
    return null;
  }
}

interface Nota {
  /** frequência em Hz */
  hz: number;
  /** quando começa, em segundos a partir de agora */
  em: number;
  /** duração em segundos */
  dura: number;
}

/** Volume base. Bipe de interface tem que ser discreto perto da voz de alguém. */
const VOLUME = 0.16;

function tocar(notas: Nota[], volume: number) {
  const audio = contexto();
  if (!audio || volume <= 0) return;

  const agora = audio.currentTime;

  for (const nota of notas) {
    const osc = audio.createOscillator();
    const ganho = audio.createGain();

    // senoide pura: onda quadrada ou dente de serra viram "alarme" no ouvido
    osc.type = "sine";
    osc.frequency.value = nota.hz;

    const inicio = agora + nota.em;
    const fim = inicio + nota.dura;

    /**
     * O envelope não é enfeite. Ligar e desligar um oscilador na marra produz
     * um clique audível — a descontinuidade na forma de onda vira um estalo.
     * A subida de 8 ms e a descida exponencial eliminam isso.
     */
    ganho.gain.setValueAtTime(0.0001, inicio);
    ganho.gain.exponentialRampToValueAtTime(volume, inicio + 0.008);
    ganho.gain.exponentialRampToValueAtTime(0.0001, fim);

    osc.connect(ganho);
    ganho.connect(audio.destination);

    osc.start(inicio);
    osc.stop(fim + 0.02);
  }
}

/**
 * O repertório.
 *
 * Os pares sobem ou descem juntos porque o significado vem do movimento, não da
 * nota: entrar sobe, sair desce; desmutar sobe, mutar desce. Quem usa aprende
 * em duas chamadas e nunca mais confunde.
 */
const SONS = {
  entrarNaChamada: [
    { hz: 523.25, em: 0, dura: 0.09 },
    { hz: 783.99, em: 0.08, dura: 0.13 },
  ],
  sairDaChamada: [
    { hz: 659.25, em: 0, dura: 0.09 },
    { hz: 415.3, em: 0.08, dura: 0.16 },
  ],
  /** alguém ENTROU na chamada em que você está — mais curto que o seu próprio */
  alguemEntrou: [{ hz: 880, em: 0, dura: 0.07 }],
  alguemSaiu: [{ hz: 523.25, em: 0, dura: 0.09 }],

  mutar: [{ hz: 440, em: 0, dura: 0.06 }],
  desmutar: [{ hz: 660, em: 0, dura: 0.06 }],
  ensurdecer: [
    { hz: 440, em: 0, dura: 0.06 },
    { hz: 330, em: 0.05, dura: 0.09 },
  ],
  desensurdecer: [
    { hz: 550, em: 0, dura: 0.06 },
    { hz: 740, em: 0.05, dura: 0.09 },
  ],

  /** começou a transmitir: três degraus subindo, tem cara de "no ar" */
  liveNoAr: [
    { hz: 523.25, em: 0, dura: 0.07 },
    { hz: 659.25, em: 0.06, dura: 0.07 },
    { hz: 987.77, em: 0.12, dura: 0.14 },
  ],
  liveEncerrada: [
    { hz: 659.25, em: 0, dura: 0.07 },
    { hz: 392, em: 0.06, dura: 0.14 },
  ],
} satisfies Record<string, Nota[]>;

export type SomDaInterface = keyof typeof SONS;

/**
 * Quem chama isto não sabe (nem precisa saber) se a pessoa está surda ou
 * desligou os bipes — a decisão mora aqui, num lugar só.
 */
export function tocarSom(nome: SomDaInterface, opcoes: { volume?: number; mudo?: boolean } = {}) {
  if (opcoes.mudo) return;
  tocar(SONS[nome], VOLUME * (opcoes.volume ?? 1));
}
