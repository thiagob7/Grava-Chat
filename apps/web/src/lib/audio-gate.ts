import { Track } from "livekit-client";
import type { AudioProcessorOptions, Room, TrackProcessor } from "livekit-client";

export type ModoDeEntrada = "voz" | "ptt";

export interface AjustesDeVoz {
  ganhoEntrada: number;
  modo: ModoDeEntrada;
  sensibilidadeAutomatica: boolean;
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

const ATAQUE_S = 0.015;
const QUEDA_S = 0.12;
export const SUSTENTACAO_MS = 320;
const INTERVALO_MS = 30;

export function decidirAbertura(params: {
  modo: ModoDeEntrada;
  nivel: number;
  limiar: number;
  pttPressionado: boolean;
  agora: number;
  abertoAte: number;
}): { aberto: boolean; abertoAte: number } {
  const { modo, nivel, limiar, pttPressionado, agora, abertoAte } = params;

  if (modo === "ptt") return { aberto: pttPressionado, abertoAte };

  const proximo = nivel >= limiar ? agora + SUSTENTACAO_MS : abertoAte;
  return { aberto: agora < proximo, abertoAte: proximo };
}

export function proximoPiso(piso: number, nivel: number): number {
  if (nivel < piso * 1.6) return piso * 0.95 + nivel * 0.05;
  if (nivel < piso * 3) return piso * 0.995 + nivel * 0.005;
  return piso;
}

export const limiarAutomatico = (piso: number) => Math.max(0.02, piso * 2.5 + 0.015);

export function precisaRemontar(params: {
  temKrisp: boolean;
  estadoApos: boolean;
  alvo: boolean;
}): boolean {
  const { temKrisp, estadoApos, alvo } = params;

  if (!temKrisp) return alvo;

  return estadoApos !== alvo;
}

function nivelDe(analisador: AnalyserNode, buffer: Float32Array<ArrayBuffer>): number {
  analisador.getFloatTimeDomainData(buffer);

  let soma = 0;
  for (const amostra of buffer) soma += amostra * amostra;

  return Math.min(1, Math.sqrt(soma / buffer.length) * 3);
}

export class ProcessadorDeVoz implements TrackProcessor<Track.Kind.Audio, AudioProcessorOptions> {
  readonly name = "gravae-voice-gate";
  processedTrack?: MediaStreamTrack;

  private ctx?: AudioContext;
  private fonte?: MediaStreamAudioSourceNode;
  private passaAlta?: BiquadFilterNode;
  private passaBaixa?: BiquadFilterNode;
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

  supressaoDisponivel = true;

  supressaoAtiva = false;

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

  onPublish = async (room: Room) => {
    this.sala = room;
    await this.krisp?.onPublish(room);
  };

  destroy = async () => {
    await this.desmontar();
    this.ouvintes.clear();
  };

  async aplicar(ajustes: Partial<AjustesDeVoz>): Promise<void> {
    const anterior = this.ajustes;
    this.ajustes = { ...anterior, ...ajustes };

    if (ajustes.ganhoEntrada !== undefined && this.ganho && this.ctx) {
      this.ganho.gain.setTargetAtTime(ajustes.ganhoEntrada, this.ctx.currentTime, 0.02);
    }

    const alvo = ajustes.supressaoDeRuido;

    if (alvo !== undefined && (alvo !== anterior.supressaoDeRuido || alvo !== this.supressaoAtiva)) {
      await this.trocarSupressao(alvo);
    }
  }

  definirPtt(pressionado: boolean) {
    this.pttPressionado = pressionado;
  }

  observarNivel(ouvinte: (nivel: number, aberto: boolean) => void) {
    this.ouvintes.add(ouvinte);
    return () => this.ouvintes.delete(ouvinte);
  }

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

      await krisp.setEnabled(true);

      this.krisp = krisp;
      this.supressaoDisponivel = true;
      this.supressaoAtiva = krisp.isEnabled();

      return krisp.processedTrack ?? opts.track;
    } catch {
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

    /*
      Recorte da faixa de voz, antes de tudo.

      A fala vive, na prática, entre 100 Hz e 8 kHz. Abaixo disso é ronco de
      mesa, ar-condicionado e o zumbido de 60 Hz da rede; acima é chiado,
      assobio de fonte e sibilância de microfone barato. Cortar as duas pontas
      tira ruído sem tocar na inteligibilidade.

      Vem ANTES do analisador de propósito: assim a porta de ruído decide olhando
      só o que é voz. Sem isso, um assobio constante contava como sinal e
      segurava o microfone aberto sozinho — que é exatamente o sintoma relatado.
    */
    this.passaAlta = ctx.createBiquadFilter();
    this.passaAlta.type = "highpass";
    this.passaAlta.frequency.value = 100;

    this.passaBaixa = ctx.createBiquadFilter();
    this.passaBaixa.type = "lowpass";
    this.passaBaixa.frequency.value = 8000;

    this.ganho = ctx.createGain();
    this.porta = ctx.createGain();
    this.analisador = ctx.createAnalyser();
    this.destino = ctx.createMediaStreamDestination();

    this.analisador.fftSize = 1024;
    this.buffer = new Float32Array(this.analisador.fftSize);
    this.ganho.gain.value = this.ajustes.ganhoEntrada;
    this.porta.gain.value = this.ajustes.modo === "ptt" ? 0 : 1;

    this.fonte.connect(this.passaAlta);
    this.passaAlta.connect(this.passaBaixa);
    this.passaBaixa.connect(this.ganho);
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

  private trocarSupressao(ligar: boolean): Promise<void> {
    this.fila = this.fila.then(() => this.executarTroca(ligar)).catch(() => undefined);
    return this.fila;
  }

  private async executarTroca(ligar: boolean) {
    if (this.krisp) {
      try {
        await this.krisp.setEnabled(ligar);
      } catch {
      }
    }

    const estadoApos = this.krisp?.isEnabled() ?? false;
    this.supressaoAtiva = estadoApos;

    if (!precisaRemontar({ temKrisp: !!this.krisp, estadoApos, alvo: ligar })) return;

    await this.remontarEntrada();
  }

  private async remontarEntrada() {
    const ctx = this.ctx;
    const track = this.trackOriginal;
    if (!ctx || !track) return;

    const antigo = this.krisp;
    this.krisp = undefined;

    const entrada = await this.prepararEntrada({ kind: Track.Kind.Audio, track, audioContext: ctx });

    this.fonte?.disconnect();
    this.fonte = ctx.createMediaStreamSource(new MediaStream([entrada]));
    /// Religa no INÍCIO da cadeia. Ligar direto no ganho pularia os filtros e o
    /// assobio voltaria só depois de trocar a supressão — bug difícil de achar.
    const primeiro = this.passaAlta ?? this.ganho;
    if (primeiro) this.fonte.connect(primeiro);

    if (antigo) await antigo.destroy().catch(() => undefined);
  }

  private async desmontar() {
    if (this.relogio) clearInterval(this.relogio);
    this.relogio = undefined;

    this.fonte?.disconnect();
    this.passaAlta?.disconnect();
    this.passaBaixa?.disconnect();
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
