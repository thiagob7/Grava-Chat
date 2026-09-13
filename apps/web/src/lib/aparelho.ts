import type { VoiceDevice } from "@gravae/shared";



const BROWSERS: [RegExp, string][] = [
  [/Edg\//, "Edge"],
  [/OPR\/|Opera/, "Opera"],
  [/Firefox\//, "Firefox"],
  [/Chrome\//, "Chrome"],
  [/Safari\//, "Safari"],
];

const SYSTEMS: [RegExp, string][] = [
  [/iPhone/, "iPhone"],
  [/iPad/, "iPad"],
  [/Android/, "Android"],
  [/Mac OS X|Macintosh/, "macOS"],
  [/Windows/, "Windows"],
  [/Linux/, "Linux"],
];

function first(map: [RegExp, string][], ua: string): string | null {
  return map.find(([fallback]) => fallback.test(ua))?.[1] ?? null;
}

export function deviceName(userAgent: string | null): string {
  if (!userAgent) return "Aparelho desconhecido";

  const app = /Electron/i.test(userAgent);
  const system = first(SYSTEMS, userAgent);

  if (app) return system ? `Aplicativo · ${system}` : "Aplicativo de desktop";

  const browser = first(BROWSERS, userAgent);

  if (browser && system) return `${browser} · ${system}`;
  return browser ?? system ?? "Aparelho desconhecido";
}

/*
  De que tipo de aparelho esta pessoa entrou na chamada.

  São três, e a ordem importa. O aplicativo de desktop responde por si, pela
  ponte, sem depender de texto de navegador. Sem ponte, a pergunta passa a ser
  se é telefone, e aí o `userAgent` é a única pista que existe — imperfeita,
  mas é o que há. O que sobra é navegador no computador.

  Errar aqui não quebra nada: o pior caso é a etiqueta do quadro mostrar o
  ícone errado.
*/
export function deviceKind(bridgeDesktop: boolean, userAgent: string | null): VoiceDevice {
  if (bridgeDesktop) return "desktop";
  if (userAgent && /iPhone|iPad|iPod|Android/i.test(userAgent)) return "mobile";

  return "web";
}
