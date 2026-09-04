import { prefsDeAparencia } from "~/features/configuracoes/stores/aparencia";
import { useAvisos } from "~/stores/notificacoes";

import notificacaoUrl from "~/assets/sons/notificacao.mp3?url";

let ctx: AudioContext | null = null;

function contexto(): AudioContext | null {
  try {
    ctx ??= new AudioContext();

    if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);

    return ctx;
  } catch {
    return null;
  }
}

interface Nota {
  hz: number;
  em: number;
  dura: number;
}

const VOLUME = 0.16;

function tocar(notas: Nota[], volume: number) {
  const audio = contexto();
  if (!audio || volume <= 0) return;

  const agora = audio.currentTime;

  for (const nota of notas) {
    const osc = audio.createOscillator();
    const ganho = audio.createGain();

    osc.type = "sine";
    osc.frequency.value = nota.hz;

    const inicio = agora + nota.em;
    const fim = inicio + nota.dura;

    ganho.gain.setValueAtTime(0.0001, inicio);
    ganho.gain.exponentialRampToValueAtTime(volume, inicio + 0.008);
    ganho.gain.exponentialRampToValueAtTime(0.0001, fim);

    osc.connect(ganho);
    ganho.connect(audio.destination);

    osc.start(inicio);
    osc.stop(fim + 0.02);
  }
}

const SONS = {
  entrarNaChamada: [
    { hz: 523.25, em: 0, dura: 0.09 },
    { hz: 783.99, em: 0.08, dura: 0.13 },
  ],
  sairDaChamada: [
    { hz: 659.25, em: 0, dura: 0.09 },
    { hz: 415.3, em: 0.08, dura: 0.16 },
  ],
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

  mensagem: [{ hz: 587.33, em: 0, dura: 0.07 }],
  mencao: [
    { hz: 659.25, em: 0, dura: 0.07 },
    { hz: 987.77, em: 0.07, dura: 0.12 },
  ],

  liveNoAr: [
    { hz: 523.25, em: 0, dura: 0.07 },
    { hz: 659.25, em: 0.06, dura: 0.07 },
    { hz: 987.77, em: 0.12, dura: 0.14 },
  ],
  liveEncerrada: [
    { hz: 659.25, em: 0, dura: 0.07 },
    { hz: 392, em: 0.06, dura: 0.14 },
  ],

  chamando: [
    { hz: 440, em: 0, dura: 0.18 },
    { hz: 440, em: 0.28, dura: 0.18 },
  ],
  tocando: [
    { hz: 587.33, em: 0, dura: 0.12 },
    { hz: 783.99, em: 0.13, dura: 0.12 },
    { hz: 587.33, em: 0.4, dura: 0.12 },
    { hz: 783.99, em: 0.53, dura: 0.12 },
  ],
  recusada: [
    { hz: 415.3, em: 0, dura: 0.1 },
    { hz: 311.13, em: 0.09, dura: 0.2 },
  ],
} satisfies Record<string, Nota[]>;

export type SomDaInterface = keyof typeof SONS;

export const NOMES_DOS_SONS = Object.keys(SONS) as SomDaInterface[];

const GRAVADOS: Partial<Record<SomDaInterface, string>> = {
  mensagem: notificacaoUrl,
};

const VOLUME_GRAVADO = 0.45;

const bytes = new Map<string, Promise<ArrayBuffer | null>>();
const decodificados = new Map<string, AudioBuffer>();

function baixar(url: string): Promise<ArrayBuffer | null> {
  let pendente = bytes.get(url);

  if (!pendente) {
    pendente = fetch(url)
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .catch(() => null);

    bytes.set(url, pendente);
  }

  return pendente;
}

for (const url of Object.values(GRAVADOS)) void baixar(url);

function emitir(audio: AudioContext, buffer: AudioBuffer, volume: number) {
  const fonte = audio.createBufferSource();
  const ganho = audio.createGain();

  fonte.buffer = buffer;
  ganho.gain.value = volume;

  fonte.connect(ganho);
  ganho.connect(audio.destination);

  fonte.start();
}

function tocarGravado(url: string, volume: number) {
  const audio = contexto();
  if (!audio || volume <= 0) return;

  const pronto = decodificados.get(url);
  if (pronto) return emitir(audio, pronto, volume);

  void baixar(url).then(async (dados) => {
    if (!dados) return;

    const buffer = await audio.decodeAudioData(dados.slice(0)).catch(() => null);
    if (!buffer) return;

    decodificados.set(url, buffer);
    emitir(audio, buffer, volume);
  });
}

export function tocarSom(nome: SomDaInterface, opcoes: { volume?: number; mudo?: boolean } = {}) {
  if (opcoes.mudo) return;

  const { modoStreamer, streamerSemSom } = prefsDeAparencia();
  if (modoStreamer && streamerSemSom) return;

  if (useAvisos.getState().sonsDesligados[nome]) return;

  const gravado = GRAVADOS[nome];
  if (gravado) return tocarGravado(gravado, VOLUME_GRAVADO * (opcoes.volume ?? 1));

  tocar(SONS[nome], VOLUME * (opcoes.volume ?? 1));
}

export interface SomDoCatalogo {
  nome: SomDaInterface;
  rotulo: string;
  quando: string;
}

export interface GrupoDeSons {
  titulo: string;
  sons: SomDoCatalogo[];
}

export const GRUPOS_DE_SONS: GrupoDeSons[] = [
  {
    titulo: "Conversa",
    sons: [
      { nome: "mensagem", rotulo: "Mensagem nova", quando: "Chegou mensagem num canal que te avisa." },
      { nome: "mencao", rotulo: "Menção a você", quando: "Alguém escreveu o seu nome." },
    ],
  },
  {
    titulo: "Chamada",
    sons: [
      { nome: "chamando", rotulo: "Chamando", quando: "Você ligou e está esperando atender." },
      { nome: "tocando", rotulo: "Tocando", quando: "Estão te ligando." },
      { nome: "recusada", rotulo: "Recusada", quando: "A pessoa não atendeu ou desligou." },
      { nome: "entrarNaChamada", rotulo: "Você entrou", quando: "Ao conectar no canal de voz." },
      { nome: "sairDaChamada", rotulo: "Você saiu", quando: "Ao desconectar." },
      { nome: "alguemEntrou", rotulo: "Alguém entrou", quando: "Outra pessoa chegou na chamada." },
      { nome: "alguemSaiu", rotulo: "Alguém saiu", quando: "Outra pessoa deixou a chamada." },
    ],
  },
  {
    titulo: "Microfone e som",
    sons: [
      { nome: "mutar", rotulo: "Microfone desligado", quando: "Ao se calar." },
      { nome: "desmutar", rotulo: "Microfone ligado", quando: "Ao voltar a falar." },
      { nome: "ensurdecer", rotulo: "Som desligado", quando: "Ao parar de ouvir todo mundo." },
      { nome: "desensurdecer", rotulo: "Som ligado", quando: "Ao voltar a ouvir." },
    ],
  },
  {
    titulo: "Transmissão",
    sons: [
      { nome: "liveNoAr", rotulo: "Live começou", quando: "Alguém do canal abriu uma transmissão." },
      { nome: "liveEncerrada", rotulo: "Live acabou", quando: "A transmissão terminou." },
    ],
  },
];

export const TODOS_OS_SONS = GRUPOS_DE_SONS.flatMap((g) => g.sons);
