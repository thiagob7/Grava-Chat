import { create } from "zustand";

import type { Secao } from "~/components/user-settings/UserSettingsModal";

interface ConfiguracoesStore {
  secao: Secao | null;
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
