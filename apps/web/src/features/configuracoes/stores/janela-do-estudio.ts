import { create } from "zustand";

import { ehDesktop } from "~/lib/desktop";

/*
  O estúdio de temas vive fora da tela de configurações.

  Ele é oficina: só serve com o app inteiro visível atrás, mudando enquanto se
  digita. Se morasse dentro do modal, fechar as configurações o levaria junto —
  e é justamente fechar as configurações que a pessoa quer fazer para ver o tema.

  No navegador ele sai numa janela do sistema, que dá para arrastar para outra
  tela e deixar ao lado do app. No aplicativo de mesa a casca abre essa mesma
  janela como janela nativa, com o preload — é lá que ela ganha o alfinete de
  fixar por cima —, mas só a partir da versão que sabe fazer isso. Se o
  bloqueador de pop-up barrar, ou se a casca for mais velha, cai na janela de
  dentro, que faz a mesma coisa sem sair daqui.
*/
interface JanelaDoEstudio {
  aberto: boolean;
  abrir: () => void;
  fechar: () => void;
}

/*
  A casca instalada sabe abrir a NOSSA janela?

  Até a 0.2.4 ela mandava todo `window.open` para o navegador e negava a
  janela — o estúdio abria uma aba do Chrome E a janela de dentro, as duas.
  Não dá para perguntar isso à casca diretamente, então vale o único sinal
  que existe: `fixarPorCima` nasceu na mesma leva do abrir-janela-nativa.
  Casca que tem um tem o outro; casca velha não tem nenhum dos dois.
*/
function aCascaAbreJanela(): boolean {
  return Boolean(window.gravae?.janela?.fixarPorCima);
}

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
