import { create } from "zustand";

/*
  Estado da conexão com o gateway, para a tela poder dizer o que está havendo.

  O socket.io reconecta sozinho — sempre reconectou. O que faltava era CONTAR
  isso: sem aviso nenhum, uma queda parece o app travado, e a pessoa fica
  clicando em coisa que não responde sem saber se o problema é ela, a internet
  ou nós.
*/
interface ConexaoStore {
  conectado: boolean;
  /// quando caiu; `null` enquanto está de pé
  caiuEm: number | null;
  tentativas: number;
  /// já esteve conectado alguma vez nesta sessão — separa "ainda subindo" de
  /// "caiu", que merecem mensagens diferentes
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
