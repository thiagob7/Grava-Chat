import { create } from "zustand";

interface ConexaoStore {
  conectado: boolean;
  caiuEm: number | null;
  tentativas: number;
  jaConectou: boolean;
  conectou: () => void;
  caiu: () => void;
  tentando: (n: number) => void;
}

export const useConexaoStore = create<ConexaoStore>((set) => ({
  conectado: false,
  caiuEm: null,
  tentativas: 0,
  jaConectou: false,

  conectou: () => set({ conectado: true, caiuEm: null, tentativas: 0, jaConectou: true }),
  caiu: () =>
    set((estado) =>
      estado.conectado || estado.caiuEm === null
        ? { conectado: false, caiuEm: Date.now() }
        : { conectado: false },
    ),
  tentando: (n) => set({ tentativas: n }),
}));
