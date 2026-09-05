import { create } from "zustand";

/*
  O estúdio de temas vive fora da tela de configurações.

  Ele é oficina: só serve com o app inteiro visível atrás, mudando enquanto se
  digita. Se morasse dentro do modal, fechar as configurações o levaria junto —
  e é justamente fechar as configurações que a pessoa quer fazer para ver o tema.
*/
interface JanelaDoEstudio {
  aberto: boolean;
  abrir: () => void;
  fechar: () => void;
}

export const useJanelaDoEstudio = create<JanelaDoEstudio>((set) => ({
  aberto: false,
  abrir: () => set({ aberto: true }),
  fechar: () => set({ aberto: false }),
}));
