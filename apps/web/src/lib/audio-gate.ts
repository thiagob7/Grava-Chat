import { Track } from "livekit-client";
import type { AudioProcessorOptions, Room, TrackProcessor } from "livekit-client";

/**
 * Como a sua voz sai daqui.
 *
 * Um único processador do LiveKit dono da cadeia inteira:
 *
 *   microfone → [Krisp] → ganho de entrada → (medidor) → porta → sala
 *
 * É um só de propósito. Uma track do LiveKit aceita UM processador, então
 * supressão de ruído, volume de entrada e corte por sensibilidade/push-to-talk
 * precisam morar juntos — separados, um desligaria o outro.
 *
 * A porta é um ganho que vai a zero, e não o mute da track: mutar renegocia com
 * o SFU a cada palavra e sai picotado. O ganho corta dentro do navegador, na
 * hora, e ninguém do outro lado vê ícone piscando.
 */

export type ModoDeEntrada = "voz" | "ptt";

export interface AjustesDeVoz {
  /** volume do microfone, 0..2 (1 = sem alteração) */
  ganhoEntrada: number;
  modo: ModoDeEntrada;
  /** true = o limiar se ajusta sozinho ao ruído do ambiente */
  sensibilidadeAutomatica: boolean;
  /** limiar manual, 0..1 na mesma escala do medidor */
  limiar: number;
  supressaoDeRuido: boolean;
}

export const AJUSTES_PADRAO: AjustesDeVoz = {
  ganhoEntrada: 1,
  modo: "voz",
  sensibilidadeAutomatica: true,
  limiar: 0.08,
  supressaoDeRuido: true,
};

/** Sobe rápido pra não comer o começo da palavra, desce devagar pra não picotar. */
const ATAQUE_S = 0.015;
const QUEDA_S = 0.12;
/** Depois de cair abaixo do limiar, continua aberto por este tempo. */
export const SUSTENTACAO_MS = 320;
const INTERVALO_MS = 30;

/**
 * A decisão de abrir ou fechar, isolada do Web Audio pra poder ser testada.
 * É a regra mais fácil de errar de um jeito silencioso: um limiar apertado
 * demais corta o começo das frases e ninguém entende por quê.
 */
export function decidirAbertura(params: {
  modo: ModoDeEntrada;
  nivel: number;
  limiar: number;
  pttPressionado: boolean;
  agora: number;
  /** momento até o qual a porta continua aberta pela sustentação */
  abertoAte: number;
}): { aberto: boolean; abertoAte: number } {
  const { modo, nivel, limiar, pttPressionado, agora, abertoAte } = params;

  if (modo === "ptt") return { aberto: pttPressionado, abertoAte };

  // cada quadro acima do limiar renova a sustentação: é ela que segura a porta
  // aberta nas pausas entre as palavras
  const proximo = nivel >= limiar ? agora + SUSTENTACAO_MS : abertoAte;
  return { aberto: agora < proximo, abertoAte: proximo };
}

/**
 * Piso de ruído do ambiente, que é o que o modo automático persegue.
 *
 * A adaptação é assimétrica de propósito:
 *  - ficou mais quieto → acompanha rápido, e o corte fica sensível de novo;
 *  - subiu um pouco (ventilador ligado, obra na rua) → sobe devagar, em alguns
 *    segundos, porque pode ser ruído mesmo;
 *  - subiu MUITO → é fala, e fala não pode virar piso; se virasse, falar por um
 *    tempo levantaria o limiar até você deixar de ser ouvido.
 */
export function proximoPiso(piso: number, nivel: number): number {
  if (nivel < piso * 1.6) return piso * 0.95 + nivel * 0.05;
  if (nivel < piso * 3) return piso * 0.995 + nivel * 0.005;
  return piso;
}

export const limiarAutomatico = (piso: number) => Math.max(0.02, piso * 2.5 + 0.015);

/**
 * Se dá pra ligar/desligar o Krisp no lugar ou se a cadeia tem que ser remontada.
 *
 * Existe separado porque é a regra que já falhou calada: o `setEnabled` do Krisp
 * devolve `boolean | undefined` e NÃO lança quando não consegue — confiar no
 * `await` sem conferir o estado depois faz a troca parecer feita quando não foi,
 * e o filtro só aparecia na chamada seguinte.
 */
export function precisaRemontar(params: {
  /** o Krisp está na cadeia de áudio agora? */
  temKrisp: boolean;
  /** o que o `isEnabled()` respondeu DEPOIS da tentativa de troca */
  estadoApos: boolean;
  alvo: boolean;
}): boolean {
  const { temKrisp, estadoApos, alvo } = params;

  // sem Krisp na cadeia: ligar exige montá-lo; desligar já é o estado atual
  if (!temKrisp) return alvo;

  // com Krisp na cadeia: só remonta se a troca no lugar não pegou
  return estadoApos !== alvo;
}

/** RMS do quadro, na mesma escala 0..1 que o medidor mostra. */
function nivelDe(analisador: AnalyserNode, buffer: Float32Array<ArrayBuffer>): number {
  analisador.getFloatTimeDomainData(buffer);

  let soma = 0;
  for (const amostra of buffer) soma += amostra * amostra;

  // ~3x pra que fala normal fique na metade da barra, e não colada no chão
  return Math.min(1, Math.sqrt(soma / buffer.length) * 3);
}

export class ProcessadorDeVoz implements TrackProcessor<Track.Kind.Audio, AudioProcessorOptions> {
  readonly name = "gravae-voice-gate";
  processedTrack?: MediaStreamTrack;

  private ctx?: AudioContext;
  private fonte?: MediaStreamAudioSourceNode;
  private ganho?: GainNode;
  private porta?: GainNode;
  private analisador?: AnalyserNode;
  private destino?: MediaStreamAudioDestinationNode;
  private buffer?: Float32Array<ArrayBuffer>;
  private relogio?: ReturnType<typeof setInterval>;

  private krisp?: import("@livekit/krisp-noise-filter").KrispNoiseFilterProcessor;
  private trackOriginal?: MediaStreamTrack;
  private sala?: Room;

  private ajustes: AjustesDeVoz;
  private pttPressionado = false;
  private abertoAte = 0;
  private pisoDeRuido = 0.02;
  private ouvintes = new Set<(nivel: number, aberto: boolean) => void>();

  /** false quando o navegador (ou o plano do LiveKit) não tem o filtro avançado. */
  supressaoDisponivel = true;

  /**
   * O que está acontecendo de fato agora, não o que foi pedido.
   *
   * A tela lia a preferência salva e mostrava "ligado" mesmo quando o filtro
   * não tinha subido — daí a impressão de que só funcionava depois de sair e
   * entrar da chamada. Quem desenha o botão tem que ler isto.
   */
  supressaoAtiva = false;

  /**
   * Fila de UMA troca por vez. Dois cliques rápidos chegavam juntos em
   * `prepararEntrada`, montavam dois Krisp e deixavam um órfão consumindo
   * microfone sem estar ligado a nada.
   */
  private fila: Promise<void> = Promise.resolve();

  constructor(ajustes: AjustesDeVoz) {
    this.ajustes = { ...ajustes };
  }

  init = async (opts: AudioProcessorOptions) => {
    this.ctx = opts.audioContext;
    this.trackOriginal = opts.track;

    const entrada = await this.prepararEntrada(opts);
    this.montarCadeia(entrada);
  };

  restart = async (opts: AudioProcessorOptions) => {
    await this.desmontar();
    await this.init(opts);
  };

  /**
   * O Krisp precisa da sala pra validar a licença — sem repassar isto, ele
   * inicializa e simplesmente não filtra.
   */
  onPublish = async (room: Room) => {
    this.sala = room;
    await this.krisp?.onPublish(room);
  };

  destroy = async () => {
    await this.desmontar();
    this.ouvintes.clear();
  };

  // ---------------------------------------------------------------- ajustes

  /**
   * Devolve promessa que só resolve quando a troca terminou de verdade.
   *
   * Antes isto era síncrono e disparava a supressão com `void`: a tela tirava o
   * "aguarde" depois de 400 ms fixos, sem relação nenhuma com o trabalho real —
   * e o Krisp leva alguns segundos pra baixar o modelo na primeira vez.
   */
  async aplicar(ajustes: Partial<AjustesDeVoz>): Promise<void> {
    const anterior = this.ajustes;
    this.ajustes = { ...anterior, ...ajustes };

    if (ajustes.ganhoEntrada !== undefined && this.ganho && this.ctx) {
      this.ganho.gain.setTargetAtTime(ajustes.ganhoEntrada, this.ctx.currentTime, 0.02);
    }

    const alvo = ajustes.supressaoDeRuido;

    // compara com o que está NO AR, não com a preferência anterior: se a troca
    // passada falhou, a preferência e a realidade divergiram, e repetir o mesmo
    // pedido tem que voltar a tentar em vez de virar no-op
    if (alvo !== undefined && (alvo !== anterior.supressaoDeRuido || alvo !== this.supressaoAtiva)) {
      await this.trocarSupressao(alvo);
    }
  }

  /** Tecla do push-to-talk pressionada ou solta. */
  definirPtt(pressionado: boolean) {
    this.pttPressionado = pressionado;
  }

  /** O medidor da tela de configurações e a barra de sensibilidade leem daqui. */
  observarNivel(ouvinte: (nivel: number, aberto: boolean) => void) {
    this.ouvintes.add(ouvinte);
    return () => this.ouvintes.delete(ouvinte);
  }

  // ------------------------------------------------------------------ interno

  private async prepararEntrada(opts: AudioProcessorOptions): Promise<MediaStreamTrack> {
    if (!this.ajustes.supressaoDeRuido) {
      this.supressaoAtiva = false;
      return opts.track;
    }

    try {
      const mod = await import("@livekit/krisp-noise-filter");
      if (!mod.isKrispNoiseFilterSupported()) {
        this.supressaoDisponivel = false;
        this.supressaoAtiva = false;
        return opts.track;
      }

      const krisp = mod.KrispNoiseFilter();
      await krisp.init(opts);
      if (this.sala) await krisp.onPublish(this.sala);

      /**
       * O `onPublish` do Krisp liga o filtro por dentro, mas sem esperar
       * (`filtro.onPublish(sala), this.setEnabled(true)` — sem `await`). Quem
       * lia o estado logo depois via `false`. Ligamos de novo, agora esperando.
       */
      await krisp.setEnabled(true);

      this.krisp = krisp;
      this.supressaoDisponivel = true;
      this.supressaoAtiva = krisp.isEnabled();

      return krisp.processedTrack ?? opts.track;
    } catch {
      // sem o filtro avançado a captura ainda tem a supressão do navegador
      this.supressaoDisponivel = false;
      this.supressaoAtiva = false;
      this.krisp = undefined;
      return opts.track;
    }
  }

  private montarCadeia(entrada: MediaStreamTrack) {
    const ctx = this.ctx;
    if (!ctx) return;

    this.fonte = ctx.createMediaStreamSource(new MediaStream([entrada]));
    this.ganho = ctx.createGain();
    this.porta = ctx.createGain();
    this.analisador = ctx.createAnalyser();
    this.destino = ctx.createMediaStreamDestination();

    this.analisador.fftSize = 1024;
    this.buffer = new Float32Array(this.analisador.fftSize);
    this.ganho.gain.value = this.ajustes.ganhoEntrada;
    this.porta.gain.value = this.ajustes.modo === "ptt" ? 0 : 1;

    this.fonte.connect(this.ganho);
    // o medidor pendura no ganho, ANTES da porta: assim a barra continua
    // mostrando a sua voz mesmo com o corte fechado — é isso que deixa
    // regular o limiar olhando pra ela
    this.ganho.connect(this.analisador);
    this.ganho.connect(this.porta);
    this.porta.connect(this.destino);

    this.processedTrack = this.destino.stream.getAudioTracks()[0];
    this.relogio = setInterval(() => this.avaliar(), INTERVALO_MS);
  }

  private avaliar() {
    const { ctx, analisador, buffer, porta } = this;
    if (!ctx || !analisador || !buffer || !porta) return;

    const nivel = nivelDe(analisador, buffer);
    const agora = Date.now();

    this.pisoDeRuido = proximoPiso(this.pisoDeRuido, nivel);

    const limiar = this.ajustes.sensibilidadeAutomatica
      ? limiarAutomatico(this.pisoDeRuido)
      : this.ajustes.limiar;

    /**
     * Nota sobre aba em segundo plano: o navegador desacelera temporizadores de
     * páginas escondidas — mas não as que estão tocando áudio, que é sempre o
     * caso numa chamada. No pior cenário o corte demora um instante a mais pra
     * abrir; continuar cortando é melhor do que abrir o microfone da sala
     * inteira porque a aba saiu de foco.
     */
    const decisao = decidirAbertura({
      modo: this.ajustes.modo,
      nivel,
      limiar,
      pttPressionado: this.pttPressionado,
      agora,
      abertoAte: this.abertoAte,
    });

    this.abertoAte = decisao.abertoAte;
    const aberto = decisao.aberto;

    const alvo = aberto ? 1 : 0;
    if (Math.abs(porta.gain.value - alvo) > 0.01) {
      porta.gain.setTargetAtTime(alvo, ctx.currentTime, aberto ? ATAQUE_S : QUEDA_S);
    }

    for (const ouvinte of this.ouvintes) ouvinte(nivel, aberto);
  }

  /**
   * Liga/desliga o Krisp sem trocar a track publicada.
   *
   * Enfileirado: cada troca espera a anterior terminar. Sem isso, clicar duas
   * vezes rápido entrava duas vezes em `prepararEntrada` e sobrava um Krisp
   * órfão.
   */
  private trocarSupressao(ligar: boolean): Promise<void> {
    this.fila = this.fila.then(() => this.executarTroca(ligar)).catch(() => undefined);
    return this.fila;
  }

  private async executarTroca(ligar: boolean) {
    // caminho barato: o Krisp já está na cadeia, é só ligar ou desligar
    if (this.krisp) {
      try {
        await this.krisp.setEnabled(ligar);
      } catch {
        /* o estado conferido abaixo decide se remonta */
      }
    }

    const estadoApos = this.krisp?.isEnabled() ?? false;
    this.supressaoAtiva = estadoApos;

    if (!precisaRemontar({ temKrisp: !!this.krisp, estadoApos, alvo: ligar })) return;

    await this.remontarEntrada();
  }

  /**
   * Refaz só o começo da cadeia (microfone → [Krisp] → ganho).
   *
   * O destino é o mesmo nó de sempre, então a track publicada não muda e
   * ninguém do outro lado percebe: não há renegociação com o SFU nem corte no
   * áudio.
   */
  private async remontarEntrada() {
    const ctx = this.ctx;
    const track = this.trackOriginal;
    if (!ctx || !track) return;

    // solta a referência ANTES: `prepararEntrada` decide sozinha se cria um
    // Krisp novo, e assim o antigo nunca é confundido com o novo
    const antigo = this.krisp;
    this.krisp = undefined;

    const entrada = await this.prepararEntrada({ kind: Track.Kind.Audio, track, audioContext: ctx });

    this.fonte?.disconnect();
    this.fonte = ctx.createMediaStreamSource(new MediaStream([entrada]));
    if (this.ganho) this.fonte.connect(this.ganho);

    // só depois da entrada nova estar ligada, pra não abrir buraco no áudio
    if (antigo) await antigo.destroy().catch(() => undefined);
  }

  private async desmontar() {
    if (this.relogio) clearInterval(this.relogio);
    this.relogio = undefined;

    this.fonte?.disconnect();
    this.ganho?.disconnect();
    this.porta?.disconnect();
    this.analisador?.disconnect();

    await this.krisp?.destroy().catch(() => undefined);
    this.krisp = undefined;
    this.supressaoAtiva = false;
    this.processedTrack?.stop();
    this.processedTrack = undefined;
  }
}

/**
 * Medidor avulso, para o teste de microfone fora de chamada — a mesma escala do
 * medidor da chamada, senão o limiar regulado no teste não valeria em call.
 */
export async function criarMedidorDeTeste(deviceId?: string) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });

  const ctx = new AudioContext();
  const fonte = ctx.createMediaStreamSource(stream);
  const analisador = ctx.createAnalyser();
  analisador.fftSize = 1024;
  fonte.connect(analisador);

  const buffer = new Float32Array(analisador.fftSize) as Float32Array<ArrayBuffer>;

  return {
    stream,
    ler: () => nivelDe(analisador, buffer),
    parar: () => {
      fonte.disconnect();
      stream.getTracks().forEach((t) => t.stop());
      void ctx.close();
    },
  };
}
