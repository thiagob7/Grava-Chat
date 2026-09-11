import { create } from "zustand";

import { isDesktop } from "~/lib/desktop";

interface StudioWindow {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

function shellOpensWindow(): boolean {
  return Boolean(window.gravae?.appWindow?.pinByUp);
}

/*
  O estúdio abre numa janela DE FORA do app, que dá para fixar por cima, soltar
  e arrastar para outro monitor. É o ponto dele: mexer no tema olhando o app
  ao lado, e não por cima.

  No navegador isso é um pedido, não uma ordem: se o Chrome resolver abrir
  como aba, ou se já existir uma aba com este nome — nesse caso ele reaproveita
  e ignora as medidas —, o resultado sai diferente do pedido. Quando o pedido
  falha de vez, cai na janela flutuante de dentro do app, logo abaixo.
*/
function openSystem(): boolean {
  if (isDesktop() && !shellOpensWindow()) return false;

  const width = Math.min(1320, Math.round(window.screen.availWidth * 0.8));
  const height = Math.min(900, Math.round(window.screen.availHeight * 0.85));

  const appWindow = window.open(
    "/estudio",
    "gc-estudio",
    `popup=yes,width=${width},height=${height},left=${Math.round(
      (window.screen.availWidth - width) / 2,
    )},top=${Math.round((window.screen.availHeight - height) / 2)}`,
  );

  if (!appWindow) return false;

  appWindow.focus();
  return true;
}

export const useStudioWindow = create<StudioWindow>((set) => ({
  isOpen: false,
  open: () => {
    if (openSystem()) return;

    set({ isOpen: true });
  },
  close: () => set({ isOpen: false }),
}));
