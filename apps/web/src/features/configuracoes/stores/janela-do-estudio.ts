import { create } from "zustand";

import { ehDesktop } from "~/lib/desktop";

interface JanelaDoEstudio {
  aberto: boolean;
  abrir: () => void;
  fechar: () => void;
}

function aCascaAbreJanela(): boolean {
  return Boolean(window.gravae?.janela?.fixarPorCima);
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
function abrirNoSistema(): boolean {
  if (ehDesktop() && !aCascaAbreJanela()) return false;

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
