import type { BridgeDesktop } from "@gravae/shared";

import { comNomesNovos } from "~/lib/ponte-mais-velha";

let translated: BridgeDesktop | null = null;

export const desktop = (): BridgeDesktop | null => {
  const raw = window.gravae ?? null;
  if (!raw) return null;

  translated ??= comNomesNovos(raw);
  return translated;
};

export const isDesktop = () => desktop() !== null;

export function markEnvironmentDesktop() {
  const bridge = desktop();
  if (!bridge) return;

  document.documentElement.classList.add("no-aplicativo");
  document.documentElement.classList.toggle("desktop-mac", bridge.platform === "darwin");
}
