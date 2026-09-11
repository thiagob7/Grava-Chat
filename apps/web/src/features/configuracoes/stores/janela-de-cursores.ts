import { create } from "zustand";

import { isDesktop } from "~/lib/desktop";

interface CursorsWindow {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

function shellOpensWindow(): boolean {
  return Boolean(window.gravae?.appWindow?.pinByUp);
}

/*
  Mesma abertura do estúdio de temas, e de propósito: janela de fora, que dá
  para fixar por cima, soltar e levar para outro monitor.

  Aqui isso vale ainda mais que lá. Cursor só se julga usando: a pessoa precisa
  do painel de um lado e do app do outro, passando o ponteiro por botão, campo
  de texto e coisa arrastável para ver se a escolha presta.
*/
function openSystem(): boolean {
  if (isDesktop() && !shellOpensWindow()) return false;

  const width = Math.min(880, Math.round(window.screen.availWidth * 0.6));
  const height = Math.min(820, Math.round(window.screen.availHeight * 0.8));

  const appWindow = window.open(
    "/cursores",
    "gc-cursores",
    `popup=yes,width=${width},height=${height},left=${Math.round(
      (window.screen.availWidth - width) / 2,
    )},top=${Math.round((window.screen.availHeight - height) / 2)}`,
  );

  if (!appWindow) return false;

  appWindow.focus();
  return true;
}

export const useCursorsWindow = create<CursorsWindow>((set) => ({
  isOpen: false,
  open: () => {
    if (openSystem()) return;

    set({ isOpen: true });
  },
  close: () => set({ isOpen: false }),
}));
