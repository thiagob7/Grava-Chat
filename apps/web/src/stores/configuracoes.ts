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
  abrir: (secao: Secao) => void;
  fechar: () => void;
}

export const useConfiguracoes = create<ConfiguracoesStore>((set) => ({
  secao: null,
  abrir: (secao) => set({ secao }),
  fechar: () => set({ secao: null }),
}));
