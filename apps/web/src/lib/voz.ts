export type ReadingMode = "nunca" | "canal-aberto" | "todos";

const LANGUAGES_PREFERRED = ["pt-BR", "pt-PT", "pt"];

export interface Spoken {
  author: string;
  text: string;
}

const MAX = 300;

export function asSpeech({ author, text }: Spoken): string {
  let clean = text
    .replace(/```[\s\S]*?```/g, " bloco de código ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(
      /https?:\/\/([^\s/]+)\S*/g,
      (_, domain: string) => ` link de ${domain} `,
    )
    .replace(/<@!?[0-9a-f]{24}>/gi, " menção ")
    .replace(/<#[0-9a-f]{24}>/gi, " canal ")
    .replace(/<a?:([a-z0-9_]+):[0-9a-f]{24}>/gi, " $1 ")
    .replace(/[*_~|]{1,2}/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (clean.length > MAX)
    clean = `${clean.slice(0, MAX)}… mensagem cortada`;

  if (!clean) return `${author} mandou um anexo`;

  return `${author} diz: ${clean}`;
}

export function availableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window))
    return [];

  const all = window.speechSynthesis.getVoices();

  return [...all].sort((a, b) => {
    const weight = LANGUAGES_PREFERRED.indexOf(a.lang) === -1 ? 1 : 0;
    const weightB = LANGUAGES_PREFERRED.indexOf(b.lang) === -1 ? 1 : 0;

    if (weight !== weightB) return weight - weightB;
    return a.name.localeCompare(b.name);
  });
}

export function fromForSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export interface SpeechOptions {
  voice?: string | null;
  speed?: number;
}

export function speak(phrase: string, options: SpeechOptions = {}): void {
  if (!fromForSpeak() || !phrase.trim()) return;

  window.speechSynthesis.cancel();

  const speech = new SpeechSynthesisUtterance(phrase);
  speech.rate = options.speed ?? 1;

  const picked = options.voice
    ? window.speechSynthesis.getVoices().find((v) => v.name === options.voice)
    : undefined;

  if (picked) {
    speech.voice = picked;
    speech.lang = picked.lang;
  } else {
    speech.lang = "pt-BR";
  }

  window.speechSynthesis.speak(speech);
}

export function silence(): void {
  if (fromForSpeak()) window.speechSynthesis.cancel();
}
