import type { BridgeDesktop } from "@gravae/shared";

export const desktop = (): BridgeDesktop | null => window.gravae ?? null;

export const isDesktop = () => desktop() !== null;

export function markEnvironmentDesktop() {
  const bridge = desktop();
  if (!bridge) return;

  document.documentElement.classList.add("no-aplicativo");
  document.documentElement.classList.toggle("desktop-mac", bridge.platform === "darwin");
}
