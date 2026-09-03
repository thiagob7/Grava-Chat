/**
 * Ler mensagem em voz alta.
 *
 * `speechSynthesis` é do navegador e não pede nada de fora: nenhuma chave,
 * nenhum servidor, nenhum áudio saindo daqui. A voz é a que o sistema já tem
 * instalada — a mesma que o VoiceOver e o Narrador usam.
 *
 * Existe para quem não pode ou não quer olhar a tela o tempo todo: quem está
 * cozinhando, quem está com o app numa segunda tela, e quem enxerga pouco.
 */

export type ModoDeLeitura = "nunca" | "canal-aberto" | "todos";

/// Nomes de voz que valem oferecer primeiro. O sistema costuma instalar
/// dezenas, quase todas de outros idiomas, e a lista crua é inútil.
const IDIOMAS_PREFERIDOS = ["pt-BR", "pt-PT", "pt"];

export interface Falado {
  autor: string;
  texto: string;
}

/*
  Limite do que é lido de uma vez.

  Uma mensagem de dois mil caracteres vira dois minutos de fala que não dá pra
  interromper sem desligar tudo. Cortar e avisar que cortou é mais honesto que
  ler o começo e parar no meio de uma frase sem explicação.
*/
const MAXIMO = 300;

/**
 * O que a voz vai dizer, a partir da mensagem.
 *
 * Separado do ato de falar porque é a parte que erra: link virando uma
 * sequência de letras, emoji virando silêncio no meio da frase, menção lida
 * como número. Aqui dá para testar cada caso sem um sintetizador por perto.
 */
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

  /*
    Português primeiro, e o resto depois — não filtrado fora.

    Filtrar deixaria sem opção quem só tem voz em inglês instalada, que é o
    caso de boa parte dos Windows em português. Melhor ordenar do que esconder.
  */
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

/**
 * Fala, e corta o que estava sendo falado.
 *
 * Enfileirar seria o padrão do navegador e é errado aqui: numa conversa
 * movimentada a fila cresce mais rápido do que a voz anda, e em um minuto a
 * pessoa está ouvindo mensagens de três minutos atrás. Conversa é agora.
 */
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
