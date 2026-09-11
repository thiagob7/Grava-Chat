import { create } from "zustand";

export interface ImageInfo {
  name?: string;
  size?: number;
}

interface Lightbox {
  url: string | null;
  alt: string;
  info: ImageInfo;
  open: (url: string, alt?: string, info?: ImageInfo) => void;
  close: () => void;
}

export const useLightbox = create<Lightbox>((set) => ({
  url: null,
  alt: "",
  info: {},
  open: (url, alt = "", info = {}) => set({ url, alt, info }),
  close: () => set({ url: null, alt: "", info: {} }),
}));
