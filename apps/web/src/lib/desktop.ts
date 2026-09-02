import type { PonteDesktop } from "@gravae/shared";

export const desktop = (): PonteDesktop | null => window.gravae ?? null;

export const ehDesktop = () => desktop() !== null;

/*
  Marca a raiz do documento com o ambiente, pro CSS poder distinguir.

  `no-aplicativo` vale em qualquer sistema e diz que existe uma janela nossa em
  volta: é ela que autoriza os enfeites de moldura — o canto curvo do painel de
  canais e o fio no alto do miolo. No navegador o app encosta na borda da aba,
  onde uma quina redonda fica solta no vazio e o fio some no topo da tela.

  `desktop-mac` é mais estreito: só no macOS a barra de título fica escondida
  (`titleBarStyle: "hiddenInset"`) e os três botões do sistema flutuam sobre o
  canto superior esquerdo, em cima do primeiro ícone da barra de servidores.
*/
export function marcarAmbienteDesktop() {
  const ponte = desktop();
  if (!ponte) return;

  document.documentElement.classList.add("no-aplicativo");
  document.documentElement.classList.toggle("desktop-mac", ponte.plataforma === "darwin");
}
