import type { RnnoiseWorkletNode } from "@sapphi-red/web-noise-suppressor";
import rnnoiseWorkletUrl from "@sapphi-red/web-noise-suppressor/rnnoiseWorklet.js?url";
import rnnoiseWasmUrl from "@sapphi-red/web-noise-suppressor/rnnoise.wasm?url";
import rnnoiseSimdWasmUrl from "@sapphi-red/web-noise-suppressor/rnnoise_simd.wasm?url";
import type { Track } from "livekit-client";
import type { AudioProcessorOptions, TrackProcessor } from "livekit-client";

let wasmDoRnnoise: Promise<ArrayBuffer> | null = null;

const contextsPrepared = new WeakSet<BaseAudioContext>();

async function createRnnoise(ctx: AudioContext): Promise<RnnoiseWorkletNode> {
  const { RnnoiseWorkletNode, loadRnnoise } = await import(
    "@sapphi-red/web-noise-suppressor"
  );

  wasmDoRnnoise ??= loadRnnoise({ url: rnnoiseWasmUrl, simdUrl: rnnoiseSimdWasmUrl });
  const binary = await wasmDoRnnoise;

  if (!contextsPrepared.has(ctx)) {
    await ctx.audioWorklet.addModule(rnnoiseWorkletUrl);
    contextsPrepared.add(ctx);
  }

  return new RnnoiseWorkletNode(ctx, { maxChannels: 2, wasmBinary: binary });
}

export type EntryMode = "voz" | "ptt";

export interface VoiceSettings {
  gainEntry: number;
  mode: EntryMode;
  sensitivityAutomatic: boolean;
  threshold: number;
  noiseSuppression: boolean;
}

export const DEFAULT_SETTINGS: VoiceSettings = {
  gainEntry: 1,
  mode: "voz",
  sensitivityAutomatic: true,
  threshold: 0.08,
  noiseSuppression: true,
};

const ATTACK_S = 0.015;
const FALL_S = 0.12;
export const SUSTAIN_MS = 320;
const INTERVAL_MS = 30;

export function decideOpening(params: {
  mode: EntryMode;
  level: number;
  threshold: number;
  pttPressed: boolean;
  now: number;
  isOpenUntil: number;
}): { isOpen: boolean; isOpenUntil: number } {
  const { mode, level, threshold, pttPressed, now, isOpenUntil } = params;

  if (mode === "ptt") return { isOpen: pttPressed, isOpenUntil };

  const next = level >= threshold ? now + SUSTAIN_MS : isOpenUntil;
  return { isOpen: now < next, isOpenUntil: next };
}

export function nextFloor(floor: number, level: number): number {
  if (level < floor * 1.6) return floor * 0.95 + level * 0.05;
  if (level < floor * 3) return floor * 0.995 + level * 0.005;
  return floor;
}

export const thresholdAutomatic = (floor: number) => Math.max(0.02, floor * 2.5 + 0.015);

function levelFor(analyser: AnalyserNode, buffer: Float32Array<ArrayBuffer>): number {
  analyser.getFloatTimeDomainData(buffer);

  let soma = 0;
  for (const sample of buffer) soma += sample * sample;

  return Math.min(1, Math.sqrt(soma / buffer.length) * 3);
}

export class VoiceProcessor implements TrackProcessor<Track.Kind.Audio, AudioProcessorOptions> {
  readonly name = "gravae-voice-gate";
  processedTrack?: MediaStreamTrack;

  private ctx?: AudioContext;
  private font?: MediaStreamAudioSourceNode;
  private passesHigh?: BiquadFilterNode;
  private passesLow?: BiquadFilterNode;
  private gain?: GainNode;
  private porta?: GainNode;
  private analyser?: AnalyserNode;
  private destination?: MediaStreamAudioDestinationNode;
  private buffer?: Float32Array<ArrayBuffer>;
  private clock?: ReturnType<typeof setInterval>;

  private rnnoise?: RnnoiseWorkletNode;

  private settings: VoiceSettings;
  private pttPressed = false;
  private isOpenUntil = 0;
  private noiseFloor = 0.02;
  private listeners = new Set<(level: number, isOpen: boolean) => void>();

  availableSuppression = true;

  activeSuppression = false;

  private queue: Promise<void> = Promise.resolve();

  constructor(settings: VoiceSettings) {
    this.settings = { ...settings };
  }

  init = async (opts: AudioProcessorOptions) => {
    this.ctx = opts.audioContext;

    await this.prepareSuppression();
    this.buildChain(opts.track);
  };

  restart = async (opts: AudioProcessorOptions) => {
    await this.unmount();
    await this.init(opts);
  };

  destroy = async () => {
    await this.unmount();
    this.listeners.clear();
  };

  async apply(settings: Partial<VoiceSettings>): Promise<void> {
    const anterior = this.settings;
    this.settings = { ...anterior, ...settings };

    if (settings.gainEntry !== undefined && this.gain && this.ctx) {
      this.gain.gain.setTargetAtTime(settings.gainEntry, this.ctx.currentTime, 0.02);
    }

    const target = settings.noiseSuppression;

    if (target !== undefined && (target !== anterior.noiseSuppression || target !== this.activeSuppression)) {
      await this.swapSuppression(target);
    }
  }

  setPtt(pressed: boolean) {
    this.pttPressed = pressed;
  }

  observeLevel(listener: (level: number, isOpen: boolean) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private async prepareSuppression() {
    const ctx = this.ctx;
    if (!ctx || !this.settings.noiseSuppression || this.rnnoise) return;

    try {
      this.rnnoise = await createRnnoise(ctx);
      this.availableSuppression = true;
    } catch (error) {
      console.warn("[voz] RNNoise não carregou:", error);
      this.rnnoise = undefined;
      this.availableSuppression = false;
    }
  }

  private turnonEntry() {
    const { font, passesHigh, rnnoise } = this;
    if (!font || !passesHigh) return;

    font.disconnect();
    rnnoise?.disconnect();

    const withSuppression = Boolean(this.settings.noiseSuppression && rnnoise);
    this.activeSuppression = withSuppression;

    if (withSuppression && rnnoise) {
      font.connect(rnnoise);
      rnnoise.connect(passesHigh);
      return;
    }

    font.connect(passesHigh);
  }

  private buildChain(entry: MediaStreamTrack) {
    const ctx = this.ctx;
    if (!ctx) return;

    this.font = ctx.createMediaStreamSource(new MediaStream([entry]));

    this.passesHigh = ctx.createBiquadFilter();
    this.passesHigh.type = "highpass";
    this.passesHigh.frequency.value = 100;

    this.passesLow = ctx.createBiquadFilter();
    this.passesLow.type = "lowpass";
    this.passesLow.frequency.value = 8000;

    this.gain = ctx.createGain();
    this.porta = ctx.createGain();
    this.analyser = ctx.createAnalyser();
    this.destination = ctx.createMediaStreamDestination();

    this.analyser.fftSize = 1024;
    this.buffer = new Float32Array(this.analyser.fftSize);
    this.gain.gain.value = this.settings.gainEntry;
    this.porta.gain.value = this.settings.mode === "ptt" ? 0 : 1;

    this.turnonEntry();
    this.passesHigh.connect(this.passesLow);
    this.passesLow.connect(this.gain);
    this.gain.connect(this.analyser);
    this.gain.connect(this.porta);
    this.porta.connect(this.destination);

    this.processedTrack = this.destination.stream.getAudioTracks()[0];
    this.clock = setInterval(() => this.evaluate(), INTERVAL_MS);
  }

  private evaluate() {
    const { ctx, analyser, buffer, porta } = this;
    if (!ctx || !analyser || !buffer || !porta) return;

    const level = levelFor(analyser, buffer);
    const now = Date.now();

    this.noiseFloor = nextFloor(this.noiseFloor, level);

    const threshold = this.settings.sensitivityAutomatic
      ? thresholdAutomatic(this.noiseFloor)
      : this.settings.threshold;

    const decision = decideOpening({
      mode: this.settings.mode,
      level,
      threshold,
      pttPressed: this.pttPressed,
      now,
      isOpenUntil: this.isOpenUntil,
    });

    this.isOpenUntil = decision.isOpenUntil;
    const isOpen = decision.isOpen;

    const target = isOpen ? 1 : 0;
    if (Math.abs(porta.gain.value - target) > 0.01) {
      porta.gain.setTargetAtTime(target, ctx.currentTime, isOpen ? ATTACK_S : FALL_S);
    }

    for (const listener of this.listeners) listener(level, isOpen);
  }

  private swapSuppression(turnon: boolean): Promise<void> {
    this.queue = this.queue.then(() => this.runSwap(turnon)).catch(() => undefined);
    return this.queue;
  }

  private async runSwap(turnon: boolean) {
    if (turnon) await this.prepareSuppression();
    this.turnonEntry();
  }

  private async unmount() {
    if (this.clock) clearInterval(this.clock);
    this.clock = undefined;

    this.font?.disconnect();
    this.passesHigh?.disconnect();
    this.passesLow?.disconnect();
    this.gain?.disconnect();
    this.porta?.disconnect();
    this.analyser?.disconnect();

    this.rnnoise?.disconnect();
    this.rnnoise?.destroy();
    this.rnnoise = undefined;
    this.activeSuppression = false;
    this.processedTrack?.stop();
    this.processedTrack = undefined;
  }
}

export async function createTestMeter(deviceId?: string, suppression = true) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });

  const ctx = new AudioContext({ sampleRate: 48_000 });
  const font = ctx.createMediaStreamSource(stream);

  const rnnoise = suppression ? await createRnnoise(ctx).catch(() => null) : null;

  const passesHigh = ctx.createBiquadFilter();
  passesHigh.type = "highpass";
  passesHigh.frequency.value = 100;

  const passesLow = ctx.createBiquadFilter();
  passesLow.type = "lowpass";
  passesLow.frequency.value = 8000;

  const output = ctx.createMediaStreamDestination();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;

  if (rnnoise) {
    font.connect(rnnoise);
    rnnoise.connect(passesHigh);
  } else {
    font.connect(passesHigh);
  }

  passesHigh.connect(passesLow);
  passesLow.connect(analyser);
  passesLow.connect(output);

  const buffer = new Float32Array(analyser.fftSize) as Float32Array<ArrayBuffer>;

  return {
    stream: output.stream,
    read: () => levelFor(analyser, buffer),
    stop: () => {
      font.disconnect();
      rnnoise?.disconnect();
      rnnoise?.destroy();
      passesHigh.disconnect();
      passesLow.disconnect();
      stream.getTracks().forEach((t) => t.stop());
      void ctx.close();
    },
  };
}
