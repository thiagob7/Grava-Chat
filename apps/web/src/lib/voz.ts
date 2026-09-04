

export type ModoDeLeitura = "nunca" | "canal-aberto" | "todos";

const IDIOMAS_PREFERIDOS = ["pt-BR", "pt-PT", "pt"];

export interface Falado {
  autor: string;
  texto: string;
}

const MAXIMO = 300;

export function comoSeFala({ autor, texto }: Falado): string {
  let limpo = texto
    /// Blocos de código não se leem — viram "crase crase crase js".
    .replace(/```[\s\S]*?```/g, " bloco de código ")
    .replace(/`([^`]+)`/g, "$1")
    /// Link inteiro é impronunciável. O domínio já diz de onde veio.
    .replace(
      /https?:\/\/([^\s/]+)\S*/g,
      (_, dominio: string) => ` link de ${dominio} `,
    )
    /// `<@id>` e `<#id>` são o formato interno da menção; o número não ajuda.
    .replace(/<@!?[0-9a-f]{24}>/gi, " menção ")
    .replace(/<#[0-9a-f]{24}>/gi, " canal ")
    /// Emoji personalizado vira o nome dele, que é a única parte pronunciável.
    .replace(/<a?:([a-z0-9_]+):[0-9a-f]{24}>/gi, " $1 ")
    /// Marcação de ênfase é para os olhos.
    .replace(/[*_~|]{1,2}/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (limpo.length > MAXIMO)
    limpo = `${limpo.slice(0, MAXIMO)}… mensagem cortada`;

  if (!limpo) return `${autor} mandou um anexo`;

  return `${autor} diz: ${limpo}`;
}

export function vozesDisponiveis(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window))
    return [];

  const todas = window.speechSynthesis.getVoices();

  return [...todas].sort((a, b) => {
    const pesoA = IDIOMAS_PREFERIDOS.indexOf(a.lang) === -1 ? 1 : 0;
    const pesoB = IDIOMAS_PREFERIDOS.indexOf(b.lang) === -1 ? 1 : 0;

    if (pesoA !== pesoB) return pesoA - pesoB;
    return a.name.localeCompare(b.name);
  });
}

export function daPraFalar(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export interface OpcoesDeFala {
  voz?: string | null;
  velocidade?: number;
}

export function falar(frase: string, opcoes: OpcoesDeFala = {}): void {
  if (!daPraFalar() || !frase.trim()) return;

  window.speechSynthesis.cancel();

  const fala = new SpeechSynthesisUtterance(frase);
  fala.rate = opcoes.velocidade ?? 1;

  const escolhida = opcoes.voz
    ? window.speechSynthesis.getVoices().find((v) => v.name === opcoes.voz)
    : undefined;

  if (escolhida) {
    fala.voice = escolhida;
    fala.lang = escolhida.lang;
  } else {
    fala.lang = "pt-BR";
  }

  window.speechSynthesis.speak(fala);
}

export function calar(): void {
  if (daPraFalar()) window.speechSynthesis.cancel();
}
