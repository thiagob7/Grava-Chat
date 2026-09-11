import { create } from "zustand";

export type ChatSide = "direita" | "baixo";

const KEY = "gravae:lado-do-chat-da-voz";

function read(): ChatSide {
  try {
    return localStorage.getItem(KEY) === "baixo" ? "baixo" : "direita";
  } catch {
    return "direita";
  }
}

interface ChatVoiceStore {
  side: ChatSide;
  setSide: (side: ChatSide) => void;
}

export const useVoiceChat = create<ChatVoiceStore>((set) => ({
  side: read(),

  setSide: (side) => {
    try {
      localStorage.setItem(KEY, side);
    } catch {}

    set({ side });
  },
}));
