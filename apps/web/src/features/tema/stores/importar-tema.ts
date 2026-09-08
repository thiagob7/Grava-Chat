import { create } from "zustand";

/*
  Qual tema está sendo importado agora.

  Mora numa store, e não no componente, porque a pergunta vem de dois lugares:
  do cartão que aparece no chat e do link solto que a pessoa clica no texto.
  O modal é um só, montado uma vez, e escuta daqui.
*/
interface ImportarTema {
  temaId: string | null;
  abrir: (temaId: string) => void;
  fechar: () => void;
}

export const useImportarTema = create<ImportarTema>((set) => ({
  temaId: null,
  abrir: (temaId) => set({ temaId }),
  fechar: () => set({ temaId: null }),
}));
