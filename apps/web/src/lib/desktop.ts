import type { PonteDesktop } from "@gravae/shared";

export const desktop = (): PonteDesktop | null => window.gravae ?? null;

export const ehDesktop = () => desktop() !== null;

export function marcarAmbienteDesktop() {
  const ponte = desktop();
  if (!ponte) return;

  document.documentElement.classList.add("no-aplicativo");
  document.documentElement.classList.toggle("desktop-mac", ponte.plataforma === "darwin");
}
