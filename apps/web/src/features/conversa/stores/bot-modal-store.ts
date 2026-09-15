import { create } from "zustand";

import type { InteractionModalPayload } from "~/@core/lib/websocket/on-interaction-modal";

type BotModalStore = {
  current: InteractionModalPayload | null;

  open: (modal: InteractionModalPayload) => void;
  close: () => void;
};

export const useBotModalStore = create<BotModalStore>((set) => ({
  current: null,

  open: (modal) => set({ current: modal }),
  close: () => set({ current: null }),
}));
