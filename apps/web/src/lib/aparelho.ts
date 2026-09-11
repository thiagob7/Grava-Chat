

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
