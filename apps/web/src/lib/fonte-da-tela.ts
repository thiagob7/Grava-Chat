
export interface FontBroadcast {
  name: string;
  icon: string | null;
}

const NAME_BY_SURFACE: Record<string, string> = {
  browser: "Uma aba do navegador",
  window: "Uma janela",
  monitor: "A tela inteira",
};

const IS_IDENTIFIER = /^(screen:|window:|[a-z-]+:\/\/)/i;

export function describeFont(
  alreadyPicked: FontBroadcast | null,
  track: { label?: string; getSettings?: () => { displaySurface?: string } } | null | undefined,
): FontBroadcast | null {
  if (alreadyPicked) return alreadyPicked;

  const label = track?.label?.trim() ?? "";
  if (label && !IS_IDENTIFIER.test(label)) return { name: label, icon: null };

  const surface = track?.getSettings?.().displaySurface ?? "";

  return { name: NAME_BY_SURFACE[surface] ?? "Sua tela", icon: null };
}
