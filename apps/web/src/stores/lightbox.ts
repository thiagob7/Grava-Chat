import { create } from "zustand";

/**
 * A imagem aberta em tela cheia, se houver.
 *
 * Fica num store e não num estado local porque quem abre (uma mensagem, um
 * anexo, um GIF) e quem desenha (o visualizador, montado uma vez no `App`) são
 * componentes distantes — e porque só pode haver uma aberta por vez.
 */
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
