import { create } from "zustand";
import type { PublicUser } from "@gravae/shared";
import { LIMITS } from "@gravae/shared";

type Entry = { user: PublicUser; at: number };

/**
 * "Está digitando" fica fora do React Query de propósito: não é estado do
 * servidor, é um sinal efêmero de alta frequência que expira sozinho por TTL —
 * não existe evento de "parou de digitar". Guardar isso no cache de queries
 * causaria re-render de listas inteiras a cada tecla.
 */
interface TypingStore {
  byChannel: Record<string, Entry[]>;
  add: (channelId: string, user: PublicUser) => void;
  clear: (channelId: string, userId: string) => void;
  activeIn: (channelId: string, exceptUserId?: string) => Entry[];
}

export const useTypingStore = create<TypingStore>((set, get) => ({
  byChannel: {},

  add: (channelId, user) =>
    set((state) => ({
      byChannel: {
        ...state.byChannel,
        [channelId]: [
          ...(state.byChannel[channelId] ?? []).filter((e) => e.user.id !== user.id),
          { user, at: Date.now() },
        ],
      },
    })),

  clear: (channelId, userId) =>
    set((state) => ({
      byChannel: {
        ...state.byChannel,
        [channelId]: (state.byChannel[channelId] ?? []).filter((e) => e.user.id !== userId),
      },
    })),

  activeIn: (channelId, exceptUserId) =>
    (get().byChannel[channelId] ?? []).filter(
      (e) => Date.now() - e.at < LIMITS.typingTtlMs && e.user.id !== exceptUserId,
    ),
}));
