import { create } from "zustand";
import type { EstadoPtt } from "@gravae/shared";

/**
 * Situação do push-to-talk global (só existe no aplicativo de desktop).
 *
 * Fica num store, e não dentro do hook, porque quem escreve é o hook que roda
 * no `App` e quem lê é a tela de Voz e vídeo — que precisa dizer, por exemplo,
 * "falta liberar o Gravaê em Acessibilidade" em vez do aviso do navegador.
 */
interface PttGlobal {
  /** `null` no navegador, ou antes da primeira resposta do aplicativo */
  estado: EstadoPtt | null;
  definir: (estado: EstadoPtt | null) => void;
}

export const usePttGlobal = create<PttGlobal>((set) => ({
  estado: null,
  definir: (estado) => set({ estado }),
}));
