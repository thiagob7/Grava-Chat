import type { PonteDesktop } from "@gravae/shared";

export const desktop = (): PonteDesktop | null => window.gravae ?? null;

export const ehDesktop = () => desktop() !== null;
