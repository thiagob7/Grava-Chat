import { create } from "zustand";

import { ehDesktop } from "~/lib/desktop";

/*
  O estúdio de temas vive fora da tela de configurações.

  Ele é oficina: só serve com o app inteiro visível atrás, mudando enquanto se
  digita. Se morasse dentro do modal, fechar as configurações o levaria junto —
  e é justamente fechar as configurações que a pessoa quer fazer para ver o tema.

  No navegador ele sai numa janela do sistema, que dá para arrastar para outra
  tela e deixar ao lado do app. Se o bloqueador de pop-up barrar, ou se estivermos
  no aplicativo de mesa — onde a versão instalada ainda manda `window.open` para
  o navegador — cai na janela de dentro, que faz a mesma coisa sem sair daqui.
*/
interface JanelaDoEstudio {
  aberto: boolean;
  abrir: () => void;
  fechar: () => void;
}

function abrirNoSistema(): boolean {
  if (ehDesktop()) return false;

  const largura = Math.min(1320, Math.round(window.screen.availWidth * 0.8));
  const altura = Math.min(900, Math.round(window.screen.availHeight * 0.85));

  const janela = window.open(
    "/estudio",
    "gc-estudio",
    `popup=yes,width=${largura},height=${altura},left=${Math.round(
      (window.screen.availWidth - largura) / 2,
    )},top=${Math.round((window.screen.availHeight - altura) / 2)}`,
  );

  if (!janela) return false;

  janela.focus();
  return true;
}

export const useJanelaDoEstudio = create<JanelaDoEstudio>((set) => ({
  aberto: false,
  abrir: () => {
    if (abrirNoSistema()) return;

    set({ aberto: true });
  },
  fechar: () => set({ aberto: false }),
}));
