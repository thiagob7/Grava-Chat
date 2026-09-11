import { create } from "zustand";

export interface ReplyTarget {
  messageId: string;
  channelId: string;
  author: string;
  authorId: string;
}

interface ReplyState {
  target: ReplyTarget | null;
  mention: boolean;
  reply: (target: ReplyTarget) => void;
  cancel: () => void;
  toggleMention: () => void;
}

export const useReplyStore = create<ReplyState>((set) => ({
  target: null,
  mention: true,
  reply: (target) => set({ target }),
  cancel: () => set({ target: null }),
  toggleMention: () => set((s) => ({ mention: !s.mention })),
}));
