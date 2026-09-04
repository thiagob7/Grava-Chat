import { create } from "zustand";

import type { Secao } from "~/components/server-settings/ServerSettingsModal";

interface ServerSettingsState {
  guildId: string | null;
  aberto: boolean;
  secao: Secao | null;
  abrir: (guildId: string, secao?: Secao) => void;
  fechar: () => void;
}

export const useServerSettingsStore = create<ServerSettingsState>((set) => ({
  guildId: null,
  aberto: false,
  secao: null,
  abrir: (guildId, secao) => set({ guildId, aberto: true, secao: secao ?? null }),
  fechar: () => set({ aberto: false }),
}));
