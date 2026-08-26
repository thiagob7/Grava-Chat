import { create } from "zustand";

import type { Secao } from "~/components/server-settings/ServerSettingsModal";

interface ServerSettingsState {
  /// De qual servidor é o pedido. O modal é montado por servidor; sem isto,
  /// trocar de servidor com o pedido no ar abriria as configurações do
  /// errado.
  guildId: string | null;
  aberto: boolean;
  /// `null` deixa o modal escolher onde cair, como sempre fez.
  secao: Secao | null;
  abrir: (guildId: string, secao?: Secao) => void;
  fechar: () => void;
}

/**
 * Abrir as configurações do servidor a partir de qualquer lugar.
 *
 * O modal mora no `ChannelSidebar`, mas quem pede pode estar longe dali — o
 * "Adicionar emoji" do seletor de expressões nasce dentro do composer, do
 * outro lado da árvore. Uma store evita passar um `onAbrirConfiguracoes` de
 * mão em mão por cinco componentes.
 */
export const useServerSettingsStore = create<ServerSettingsState>((set) => ({
  guildId: null,
  aberto: false,
  secao: null,
  abrir: (guildId, secao) => set({ guildId, aberto: true, secao: secao ?? null }),
  fechar: () => set({ aberto: false }),
}));
