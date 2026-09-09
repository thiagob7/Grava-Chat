import { create } from "zustand";

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
