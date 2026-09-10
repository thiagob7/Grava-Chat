import { create } from "zustand";

import { ehDesktop } from "~/lib/desktop";

interface JanelaDeCursores {
  aberto: boolean;
  abrir: () => void;
  fechar: () => void;
}

function aCascaAbreJanela(): boolean {
  return Boolean(window.gravae?.janela?.fixarPorCima);
}

/*
  Mesma abertura do estúdio de temas, e de propósito: janela de fora, que dá
  para fixar por cima, soltar e levar para outro monitor.

  Aqui isso vale ainda mais que lá. Cursor só se julga usando: a pessoa precisa
  do painel de um lado e do app do outro, passando o ponteiro por botão, campo
  de texto e coisa arrastável para ver se a escolha presta.
*/
function abrirNoSistema(): boolean {
  if (ehDesktop() && !aCascaAbreJanela()) return false;

  const largura = Math.min(880, Math.round(window.screen.availWidth * 0.6));
  const altura = Math.min(820, Math.round(window.screen.availHeight * 0.8));

  const janela = window.open(
    "/cursores",
    "gc-cursores",
    `popup=yes,width=${largura},height=${altura},left=${Math.round(
      (window.screen.availWidth - largura) / 2,
    )},top=${Math.round((window.screen.availHeight - altura) / 2)}`,
  );

  if (!janela) return false;

  janela.focus();
  return true;
}

export const useJanelaDeCursores = create<JanelaDeCursores>((set) => ({
  aberto: false,
  abrir: () => {
    if (abrirNoSistema()) return;

    set({ aberto: true });
  },
  fechar: () => set({ aberto: false }),
}));
