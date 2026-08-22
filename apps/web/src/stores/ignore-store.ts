import { create } from "zustand";

/**
 * Quem você escolheu ignorar.
 *
 * Fica só neste navegador, em localStorage, e NÃO no servidor — de propósito.
 * Ignorar é uma preferência de leitura sua: a pessoa continua no servidor,
 * continua sendo vista por todo mundo, e nada muda pra ela. Levar isso pro
 * servidor viraria um bloqueio pela metade, com a expectativa errada de que
 * teria algum efeito do outro lado.
 *
 * Bloquear é a versão com efeito de verdade — essa mora no servidor.
 */
const CHAVE = "gravae:ignorados";

function ler(): string[] {
  try {
    const salvo = localStorage.getItem(CHAVE);
    return salvo ? (JSON.parse(salvo) as string[]) : [];
  } catch {
    return [];
  }
}

interface IgnoreStore {
  ignorados: string[];
  alternar: (userId: string) => void;
  estaIgnorado: (userId: string) => boolean;
}

export const useIgnoreStore = create<IgnoreStore>((set, store) => ({
  ignorados: ler(),

  alternar: (userId) => {
    const atual = store().ignorados;
    const proximo = atual.includes(userId)
      ? atual.filter((id) => id !== userId)
      : [...atual, userId];

    set({ ignorados: proximo });

    try {
      localStorage.setItem(CHAVE, JSON.stringify(proximo));
    } catch {
      /* modo privado sem storage: vale só nesta sessão */
    }
  },

  estaIgnorado: (userId) => store().ignorados.includes(userId),
}));
