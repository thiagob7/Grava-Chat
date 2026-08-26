import { create } from "zustand";

export interface AlvoDaModeracao {
  guildId: string;
  userId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

/**
 * Quem está aberto na visualização de moderador.
 *
 * Fica numa store porque quem ABRE (o cartão de perfil, dentro da lista de
 * membros) não é quem DESENHA: o painel é uma coluna da tela, ao lado da
 * lista, e não um pedaço do cartão. Era por isso que ele nascia como janela
 * flutuante por cima de tudo — o único lugar que um popover alcança.
 */
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
