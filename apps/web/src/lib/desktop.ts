import type { PonteDesktop } from "@gravae/shared";

/**
 * O mesmo front roda no navegador e dentro do aplicativo. Tudo que é exclusivo
 * do desktop passa por aqui: `desktop()` devolve `null` no navegador, e cada
 * recurso decide o que fazer sem `if (Electron)` espalhado pelo código.
 *
 * O contrato (`PonteDesktop`) mora em `@gravae/shared` porque o outro lado dele
 * é o preload do Electron — os dois compilam contra o mesmo tipo.
 */
export const desktop = (): PonteDesktop | null => window.gravae ?? null;

export const ehDesktop = () => desktop() !== null;
