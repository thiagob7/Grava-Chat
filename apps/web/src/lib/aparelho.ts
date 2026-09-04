

const NAVEGADORES: [RegExp, string][] = [
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

  const app = /Electron/i.test(userAgent);
  const sistema = primeiro(SISTEMAS, userAgent);

  if (app) return sistema ? `Aplicativo · ${sistema}` : "Aplicativo de desktop";

  const navegador = primeiro(NAVEGADORES, userAgent);

  if (navegador && sistema) return `${navegador} · ${sistema}`;
  return navegador ?? sistema ?? "Aparelho desconhecido";
}
