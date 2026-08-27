import type { RnnoiseWorkletNode } from "@sapphi-red/web-noise-suppressor";
import rnnoiseWorkletUrl from "@sapphi-red/web-noise-suppressor/rnnoiseWorklet.js?url";
import rnnoiseWasmUrl from "@sapphi-red/web-noise-suppressor/rnnoise.wasm?url";
import rnnoiseSimdWasmUrl from "@sapphi-red/web-noise-suppressor/rnnoise_simd.wasm?url";
import type { Track } from "livekit-client";
import type { AudioProcessorOptions, TrackProcessor } from "livekit-client";

/*
  Supressão de ruído: RNNoise, uma rede pequena que roda em WASM aqui no
  navegador mesmo.

  Antes era o Krisp. O Krisp é melhor, mas a licença dele exige LiveKit Cloud
  para o transporte de mídia, e o Gravaê hospeda o próprio SFU — então ele
  nunca chegou a ligar: a checagem no `onPublish` reprovava, o `catch` marcava
  indisponível, e o que sobrava era a cadeia de filtros aqui embaixo. O RNNoise
  é BSD-3, não fala com servidor nenhum e não tem teto de minutos.
*/

/// O binário é o mesmo pra sempre: busca uma vez e reaproveita.
let wasmDoRnnoise: Promise<ArrayBuffer> | null = null;

/// `addModule` vale por contexto de áudio, e chamada e "ouvir minha voz" têm
/// contextos diferentes. Refazer no mesmo contexto seria só trabalho repetido.
const contextosPreparados = new WeakSet<BaseAudioContext>();

async function criarRnnoise(ctx: AudioContext): Promise<RnnoiseWorkletNode> {
  /*
    Import dinâmico por dois motivos. O pacote declara classes que estendem
    `AudioWorkletNode` já no topo do módulo, então importá-lo estaticamente
    quebrava os testes das funções puras daqui — que rodam em Node, onde essa
    classe não existe. E, de quebra, quem nunca liga a supressão não carrega
    nada disso.
  */
  const { RnnoiseWorkletNode, loadRnnoise } = await import(
    "@sapphi-red/web-noise-suppressor"
  );

  wasmDoRnnoise ??= loadRnnoise({ url: rnnoiseWasmUrl, simdUrl: rnnoiseSimdWasmUrl });
  const binario = await wasmDoRnnoise;

  if (!contextosPreparados.has(ctx)) {
    await ctx.audioWorklet.addModule(rnnoiseWorkletUrl);
    contextosPreparados.add(ctx);
  }

  return new RnnoiseWorkletNode(ctx, { maxChannels: 2, wasmBinary: binario });
}

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

  private rnnoise?: RnnoiseWorkletNode;

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

    await this.prepararSupressao();
    this.montarCadeia(opts.track);
  };

  restart = async (opts: AudioProcessorOptions) => {
    await this.desmontar();
    await this.init(opts);
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

  /*
    Carrega o RNNoise sob demanda: quem deixa a supressão desligada nunca baixa
    os 150 kB de WASM. Falhou — navegador sem AudioWorklet, rede caiu no meio —
    a chamada segue com a cadeia de filtros, e a tela mostra "indisponível".
  */
  private async prepararSupressao() {
    const ctx = this.ctx;
    if (!ctx || !this.ajustes.supressaoDeRuido || this.rnnoise) return;

    try {
      this.rnnoise = await criarRnnoise(ctx);
      this.supressaoDisponivel = true;
    } catch (erro) {
      console.warn("[voz] RNNoise não carregou:", erro);
      this.rnnoise = undefined;
      this.supressaoDisponivel = false;
    }
  }

  /*
    Religa o começo da cadeia com ou sem o RNNoise no meio — é isso que a chave
    de supressão faz agora.

    Com o Krisp era preciso derrubar e remontar a entrada inteira, porque ele
    entregava outra MediaStreamTrack. O RNNoise é um nó do próprio grafo: ligar
    e desligar é reconectar dois fios, sem intervalo audível.
  */
  private ligarEntrada() {
    const { fonte, passaAlta, rnnoise } = this;
    if (!fonte || !passaAlta) return;

    fonte.disconnect();
    rnnoise?.disconnect();

    const comSupressao = Boolean(this.ajustes.supressaoDeRuido && rnnoise);
    this.supressaoAtiva = comSupressao;

    if (comSupressao && rnnoise) {
      fonte.connect(rnnoise);
      rnnoise.connect(passaAlta);
      return;
    }

    fonte.connect(passaAlta);
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

    /// O RNNoise vem primeiro, no sinal cheio — é onde a rede foi treinada. Os
    /// filtros de faixa limpam o resíduo logo depois.
    this.ligarEntrada();
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
    if (ligar) await this.prepararSupressao();
    this.ligarEntrada();
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

    this.rnnoise?.disconnect();
    this.rnnoise?.destroy();
    this.rnnoise = undefined;
    this.supressaoAtiva = false;
    this.processedTrack?.stop();
    this.processedTrack = undefined;
  }
}

export async function criarMedidorDeTeste(deviceId?: string, supressao = true) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });

  /// 48 kHz na marra: é a taxa em que o RNNoise foi treinado, e a mesma que o
  /// LiveKit usa na chamada. Sem fixar, uma placa em 44,1 kHz faria o teste
  /// soar diferente do que sai na call.
  const ctx = new AudioContext({ sampleRate: 48_000 });
  const fonte = ctx.createMediaStreamSource(stream);

  const rnnoise = supressao ? await criarRnnoise(ctx).catch(() => null) : null;

  /*
    A MESMA cadeia da chamada — RNNoise e filtros. Sem eles o teste devolvia o microfone
    cru: a tela promete "verde é o que sai daqui" e entregava outra coisa, então
    quem ouvia o próprio assobio aqui concluía que o filtro não funcionava — mas
    na chamada ele estava lá.

    Se os valores mudarem em `montarCadeia`, mudam aqui junto; é o preço de ter
    dois caminhos de áudio, e o teste mentir é pior que a duplicação.
  */
  const passaAlta = ctx.createBiquadFilter();
  passaAlta.type = "highpass";
  passaAlta.frequency.value = 100;

  const passaBaixa = ctx.createBiquadFilter();
  passaBaixa.type = "lowpass";
  passaBaixa.frequency.value = 8000;

  const saida = ctx.createMediaStreamDestination();
  const analisador = ctx.createAnalyser();
  analisador.fftSize = 1024;

  if (rnnoise) {
    fonte.connect(rnnoise);
    rnnoise.connect(passaAlta);
  } else {
    fonte.connect(passaAlta);
  }

  passaAlta.connect(passaBaixa);
  passaBaixa.connect(analisador);
  passaBaixa.connect(saida);

  const buffer = new Float32Array(analisador.fftSize) as Float32Array<ArrayBuffer>;

  return {
    /// O stream filtrado, que é o que o "Ouvir minha voz" toca de volta.
    stream: saida.stream,
    ler: () => nivelDe(analisador, buffer),
    parar: () => {
      fonte.disconnect();
      rnnoise?.disconnect();
      rnnoise?.destroy();
      passaAlta.disconnect();
      passaBaixa.disconnect();
      stream.getTracks().forEach((t) => t.stop());
      void ctx.close();
    },
  };
}
