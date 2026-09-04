import { create } from "zustand";

export interface AlvoDaModeracao {
  guildId: string;
  userId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

interface StoreDeModeracao {
  alvo: AlvoDaModeracao | null;
  abrir: (alvo: AlvoDaModeracao) => void;
  fechar: () => void;
}

export const useModeracao = create<StoreDeModeracao>((set) => ({
  alvo: null,
  abrir: (alvo) => set({ alvo }),
  fechar: () => set({ alvo: null }),
}));
