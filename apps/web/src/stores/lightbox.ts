import { create } from "zustand";

export interface ImageInfo {
  name?: string;
  size?: number;
  id?: string;
}

export interface LightboxMessage {
  id: string;
  channelId: string;
  guildId?: string | null;
  authorId: string;
  authorName: string;
}

interface Lightbox {
  url: string | null;
  alt: string;
  info: ImageInfo;
  message: LightboxMessage | null;
  open: (url: string, alt?: string, info?: ImageInfo, message?: LightboxMessage | null) => void;
  close: () => void;
}

export const useLightbox = create<Lightbox>((set) => ({
  url: null,
  alt: "",
  info: {},
  message: null,
  open: (url, alt = "", info = {}, message = null) => set({ url, alt, info, message }),
  close: () => set({ url: null, alt: "", info: {}, message: null }),
}));
