import { appearancePrefs } from "~/features/configuracoes/stores/aparencia";
import { useNotices } from "~/stores/notificacoes";

import notificationUrl from "~/assets/sons/notificacao.mp3?url";

let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  try {
    ctx ??= new AudioContext();

    if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);

    return ctx;
  } catch {
    return null;
  }
}

interface Note {
  hz: number;
  em: number;
  dura: number;
}

const VOLUME = 0.16;

function play(notes: Note[], volume: number) {
  const audio = context();
  if (!audio || volume <= 0) return;

  const now = audio.currentTime;

  for (const note of notes) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();

    osc.type = "sine";
    osc.frequency.value = note.hz;

    const start = now + note.em;
    const end = start + note.dura;

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    osc.connect(gain);
    gain.connect(audio.destination);

    osc.start(start);
    osc.stop(end + 0.02);
  }
}

const SOUNDS = {
  joinCall: [
    { hz: 523.25, em: 0, dura: 0.09 },
    { hz: 783.99, em: 0.08, dura: 0.13 },
  ],
  leaveCall: [
    { hz: 659.25, em: 0, dura: 0.09 },
    { hz: 415.3, em: 0.08, dura: 0.16 },
  ],
  someoneJoined: [{ hz: 880, em: 0, dura: 0.07 }],
  someoneLeft: [{ hz: 523.25, em: 0, dura: 0.09 }],

  mute: [{ hz: 440, em: 0, dura: 0.06 }],
  unmute: [{ hz: 660, em: 0, dura: 0.06 }],
  deafen: [
    { hz: 440, em: 0, dura: 0.06 },
    { hz: 330, em: 0.05, dura: 0.09 },
  ],
  undeafen: [
    { hz: 550, em: 0, dura: 0.06 },
    { hz: 740, em: 0.05, dura: 0.09 },
  ],

  message: [{ hz: 587.33, em: 0, dura: 0.07 }],
  mention: [
    { hz: 659.25, em: 0, dura: 0.07 },
    { hz: 987.77, em: 0.07, dura: 0.12 },
  ],

  liveNoAr: [
    { hz: 523.25, em: 0, dura: 0.07 },
    { hz: 659.25, em: 0.06, dura: 0.07 },
    { hz: 987.77, em: 0.12, dura: 0.14 },
  ],
  liveEnded: [
    { hz: 659.25, em: 0, dura: 0.07 },
    { hz: 392, em: 0.06, dura: 0.14 },
  ],

  calling: [
    { hz: 440, em: 0, dura: 0.18 },
    { hz: 440, em: 0.28, dura: 0.18 },
  ],
  playing: [
    { hz: 587.33, em: 0, dura: 0.12 },
    { hz: 783.99, em: 0.13, dura: 0.12 },
    { hz: 587.33, em: 0.4, dura: 0.12 },
    { hz: 783.99, em: 0.53, dura: 0.12 },
  ],
  refused: [
    { hz: 415.3, em: 0, dura: 0.1 },
    { hz: 311.13, em: 0.09, dura: 0.2 },
  ],
} satisfies Record<string, Note[]>;

export type InterfaceSound = keyof typeof SOUNDS;

export const SOUNDS_NAMES = Object.keys(SOUNDS) as InterfaceSound[];

const RECORDED: Partial<Record<InterfaceSound, string>> = {
  message: notificationUrl,
};

const VOLUME_RECORDED = 0.45;

const bytes = new Map<string, Promise<ArrayBuffer | null>>();
const decoded = new Map<string, AudioBuffer>();

function download(url: string): Promise<ArrayBuffer | null> {
  let pending = bytes.get(url);

  if (!pending) {
    pending = fetch(url)
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .catch(() => null);

    bytes.set(url, pending);
  }

  return pending;
}

for (const url of Object.values(RECORDED)) void download(url);

function emit(audio: AudioContext, buffer: AudioBuffer, volume: number) {
  const font = audio.createBufferSource();
  const gain = audio.createGain();

  font.buffer = buffer;
  gain.gain.value = volume;

  font.connect(gain);
  gain.connect(audio.destination);

  font.start();
}

function playRecorded(url: string, volume: number) {
  const audio = context();
  if (!audio || volume <= 0) return;

  const ready = decoded.get(url);
  if (ready) return emit(audio, ready, volume);

  void download(url).then(async (data) => {
    if (!data) return;

    const buffer = await audio.decodeAudioData(data.slice(0)).catch(() => null);
    if (!buffer) return;

    decoded.set(url, buffer);
    emit(audio, buffer, volume);
  });
}

export function playSound(name: InterfaceSound, options: { volume?: number; isMuted?: boolean } = {}) {
  if (options.isMuted) return;

  const { modeStreamer, streamerWithoutSound } = appearancePrefs();
  if (modeStreamer && streamerWithoutSound) return;

  if (useNotices.getState().soundsOff[name]) return;

  const recorded = RECORDED[name];
  if (recorded) return playRecorded(recorded, VOLUME_RECORDED * (options.volume ?? 1));

  play(SOUNDS[name], VOLUME * (options.volume ?? 1));
}

export interface CatalogSound {
  name: InterfaceSound;
  label: string;
  when: string;
}

export interface SoundsGroup {
  title: string;
  sounds: CatalogSound[];
}

export const SOUNDS_GROUPS: SoundsGroup[] = [
  {
    title: "Conversa",
    sounds: [
      { name: "message", label: "Mensagem nova", when: "Chegou mensagem num canal que te avisa." },
      { name: "mention", label: "Menção a você", when: "Alguém escreveu o seu nome." },
    ],
  },
  {
    title: "Chamada",
    sounds: [
      { name: "calling", label: "Calling", when: "Você ligou e está esperando atender." },
      { name: "playing", label: "Tocando", when: "Estão te ligando." },
      { name: "refused", label: "Recusada", when: "A pessoa não atendeu ou desligou." },
      { name: "joinCall", label: "Você entrou", when: "Ao conectar no canal de voz." },
      { name: "leaveCall", label: "Você saiu", when: "Ao desconectar." },
      { name: "someoneJoined", label: "Alguém entrou", when: "Outra pessoa chegou na chamada." },
      { name: "someoneLeft", label: "Alguém saiu", when: "Outra pessoa deixou a chamada." },
    ],
  },
  {
    title: "Microfone e som",
    sounds: [
      { name: "mute", label: "Microfone desligado", when: "Ao se calar." },
      { name: "unmute", label: "Microfone ligado", when: "Ao voltar a falar." },
      { name: "deafen", label: "Som desligado", when: "Ao parar de ouvir todo mundo." },
      { name: "undeafen", label: "Som ligado", when: "Ao voltar a ouvir." },
    ],
  },
  {
    title: "Transmissão",
    sounds: [
      { name: "liveNoAr", label: "Live começou", when: "Alguém do canal abriu uma transmissão." },
      { name: "liveEnded", label: "Live acabou", when: "A transmissão terminou." },
    ],
  },
];

export const ALL_SOUNDS = SOUNDS_GROUPS.flatMap((g) => g.sounds);
