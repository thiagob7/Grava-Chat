import type { PonteDesktop } from "@gravae/shared";

export const desktop = (): PonteDesktop | null => window.gravae ?? null;

export const ehDesktop = () => desktop() !== null;

/*
  Marca a raiz do documento quando estamos no aplicativo de desktop em macOS.

  Ali a barra de título fica escondida (`titleBarStyle: "hiddenInset"`) e os três
  botões do sistema flutuam sobre o canto superior esquerdo — em cima do primeiro
  ícone da barra de servidores. O CSS usa esta classe pra abrir espaço só nesse
  caso; no navegador e no Windows nada muda.
*/
export function marcarAmbienteDesktop() {
  const ponte = desktop();
  if (!ponte) return;

  const mac = ponte.plataforma === "darwin";
  document.documentElement.classList.toggle("desktop-mac", mac);
}
