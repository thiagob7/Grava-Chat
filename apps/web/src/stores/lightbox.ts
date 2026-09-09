import { create } from "zustand";

export interface InfoDaImagem {
  nome?: string;
  tamanho?: number;
}

interface Lightbox {
  url: string | null;
  alt: string;
  info: InfoDaImagem;
  abrir: (url: string, alt?: string, info?: InfoDaImagem) => void;
  fechar: () => void;
}

export const useLightbox = create<Lightbox>((set) => ({
  url: null,
  alt: "",
  info: {},
  abrir: (url, alt = "", info = {}) => set({ url, alt, info }),
  fechar: () => set({ url: null, alt: "", info: {} }),
}));
