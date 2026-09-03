/*
  O `user-agent` virando nome de aparelho.

  Ninguém reconhece a própria sessão por "Mozilla/5.0 (Macintosh; Intel Mac OS
  X 10_15_7) AppleWebKit/537.36…". A pergunta de quem olha a lista é "qual
  destes sou eu agora e qual é o do trabalho" — e ela se responde com duas
  palavras: o navegador e o sistema.

  É reconhecimento por palpite, e assumidamente: `user-agent` é texto que o
  cliente escolhe, então isto orienta, não prova. Por isso o IP aparece ao
  lado — quando o palpite erra, ele ainda ajuda a distinguir.
*/

const NAVEGADORES: [RegExp, string][] = [
  /// A ordem importa: Edge e Opera se dizem Chrome, e Chrome se diz Safari.
  [/Edg\//, "Edge"],
  [/OPR\/|Opera/, "Opera"],
  [/Firefox\//, "Firefox"],
  [/Chrome\//, "Chrome"],
  [/Safari\//, "Safari"],
];

const SISTEMAS: [RegExp, string][] = [
  [/iPhone/, "iPhone"],
  [/iPad/, "iPad"],
  [/Android/, "Android"],
  [/Mac OS X|Macintosh/, "macOS"],
  [/Windows/, "Windows"],
  [/Linux/, "Linux"],
];

function primeiro(mapa: [RegExp, string][], ua: string): string | null {
  return mapa.find(([padrao]) => padrao.test(ua))?.[1] ?? null;
}

export function nomeDoAparelho(userAgent: string | null): string {
  if (!userAgent) return "Aparelho desconhecido";

  /// O Electron se anuncia no `user-agent`, e é a informação mais útil ali:
  /// "aplicativo" diz mais do que o navegador que ele usa por dentro.
  const app = /Electron/i.test(userAgent);
  const sistema = primeiro(SISTEMAS, userAgent);

  if (app) return sistema ? `Aplicativo · ${sistema}` : "Aplicativo de desktop";

  const navegador = primeiro(NAVEGADORES, userAgent);

  if (navegador && sistema) return `${navegador} · ${sistema}`;
  return navegador ?? sistema ?? "Aparelho desconhecido";
}
