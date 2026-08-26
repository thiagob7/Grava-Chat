import { create } from "zustand";

interface Lightbox {
  url: string | null;
  alt: string;
  abrir: (url: string, alt?: string) => void;
  fechar: () => void;
}

export const useLightbox = create<Lightbox>((set) => ({
  url: null,
  alt: "",
  abrir: (url, alt = "") => set({ url, alt }),
  fechar: () => set({ url: null, alt: "" }),
}));
