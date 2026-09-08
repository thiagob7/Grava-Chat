/*
  As contas da mensagem de voz.

  Tudo aqui é puro de propósito: o gravador de verdade depende do navegador,
  mas escolher formato, encolher a onda e escrever a duração são decisões que
  merecem teste sem abrir microfone nenhum.
*/

/// 24 kbps mono. O padrão do navegador é 128 — quatro vezes maior sem ganho
/// nenhum para fala. A 24 a voz sai limpa e dois minutos cabem em ~350 KB.
export const TAXA_DE_VOZ = 24_000;

/// Dois minutos. Acima disso deixa de ser recado e vira gravação de chamada,
/// que é outra coisa e pede outra tela.
export const LIMITE_MS = 120_000;

/// Quantas barrinhas a onda tem. Fixo, para o desenho não mudar de densidade
/// conforme a duração — um recado de 5s e um de 2min têm a mesma cara.
export const BARRAS = 40;

/*
  Opus primeiro, sempre: é o único que soa bem a 24 kbps. O Safari só grava
  em MP4/AAC, que na mesma taxa sai pior — mas pior é melhor que nada, então
  ele fecha a fila em vez de barrar o recurso.
*/
const PREFERIDOS = [
  "audio/webm;codecs=opus",
  "audio/ogg;codecs=opus",
  "audio/webm",
  "audio/mp4",
];

export function formatoDeGravacao(suporta: (tipo: string) => boolean): string | null {
  return PREFERIDOS.find(suporta) ?? null;
}

export const extensaoDoFormato = (mime: string) =>
  mime.startsWith("audio/ogg") ? "ogg" : mime.startsWith("audio/mp4") ? "m4a" : "webm";

/*
  Encolhe os picos medidos durante a gravação até o número de barras.

  Cada barra vira o MAIOR pico do seu pedaço, e não a média: média achata
  tudo em um traço morno, enquanto o pico guarda o desenho da fala — que é a
  única coisa que a barrinha tem para dizer.
*/
export function encaixarOndas(picos: number[], barras = BARRAS): number[] {
  if (!picos.length) return new Array(barras).fill(0);
  if (picos.length <= barras) {
    return Array.from({ length: barras }, (_, i) => picos[Math.floor((i * picos.length) / barras)] ?? 0);
  }

  const porBarra = picos.length / barras;

  return Array.from({ length: barras }, (_, i) => {
    const pedaco = picos.slice(Math.floor(i * porBarra), Math.max(Math.floor((i + 1) * porBarra), Math.floor(i * porBarra) + 1));
    return pedaco.reduce((maior, v) => Math.max(maior, v), 0);
  });
}

/*
  A onda cabe numa string curta: cada barra é um dígito na base 36, de 0 a z.
  Quarenta barras viram quarenta caracteres — menos que o nome do arquivo, e
  o suficiente para o desenho.
*/
export function escreverOndas(picos: number[]): string {
  return picos
    .map((v) => Math.round(Math.min(Math.max(v, 0), 1) * 35).toString(36))
    .join("");
}

export function lerOndas(texto: string | null | undefined): number[] {
  if (!texto) return [];

  return [...texto].map((c) => {
    const n = parseInt(c, 36);
    return Number.isNaN(n) ? 0 : n / 35;
  });
}

/// "0:07", "1:05", "2:00". Sempre com dois dígitos nos segundos, senão o
/// balão pula de largura a cada segundo que passa.
export function duracaoEscrita(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));

  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/// O tamanho que o recado vai ter, para avisar antes de mandar.
export const bytesEstimados = (ms: number) => Math.round((TAXA_DE_VOZ / 8) * (ms / 1000));
