import { create } from "zustand";

import type { Secao } from "~/components/user-settings/UserSettingsModal";

/*
  Quem pede pra abrir as Configurações, de qualquer canto do app.

  O modal mora no `UserPanel`, no rodapé da barra lateral — e quem precisa
  abri-lo quase nunca está lá perto: o popover da supressão de ruído quer a aba
  de voz, o aviso de permissão do macOS quer a de aplicativo. Passar callback de
  mão em mão por essa distância toda seria enfiar um parâmetro em cada
  componente do caminho só pra ele repassar adiante.
*/
interface ConfiguracoesStore {
  /// `null` = fechado
  secao: Secao | null;
  /*
    A seção de dentro da tela, quando quem abriu sabe qual quer.

    É o que um link copiado carrega: abrir "Aparência" e cair no alto não
    cumpre a promessa de um link que dizia "Modo streamer". Some assim que o
    modal a consome, senão trocar de tela e voltar pularia de novo pra lá.
  */
  subInicial: string | null;
  abrir: (secao: Secao, sub?: string) => void;
  consumirSubInicial: () => void;
  fechar: () => void;
}

export const useConfiguracoes = create<ConfiguracoesStore>((set) => ({
  secao: null,
  subInicial: null,
  abrir: (secao, sub) => set({ secao, subInicial: sub ?? null }),
  consumirSubInicial: () => set({ subInicial: null }),
  fechar: () => set({ secao: null, subInicial: null }),
}));
