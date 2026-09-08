import { create } from "zustand";

import {
  alternarPasta,
  desfazerPasta,
  editarPasta,
  moverServidor,
  type Arrumacao,
  type Destino,
} from "~/features/servidor/lib/trilho";

/*
  A arrumação do trilho é da pessoa e deste aparelho: fica no localStorage,
  como os favoritos. Não vai para a API de propósito — ninguém mais precisa
  saber em que pasta você pôs o quê.
*/
interface StoreDePastas {
  arrumacao: Arrumacao;
  mover: (guildIds: string[], guildId: string, destino: Destino) => void;
  alternar: (pastaId: string) => void;
  editar: (pastaId: string, dados: Parameters<typeof editarPasta>[2]) => void;
  desfazer: (pastaId: string) => void;
}

const CHAVE = "gravae:trilho";

function ler(): Arrumacao {
  try {
    const salvo = localStorage.getItem(CHAVE);
    const lido = salvo ? (JSON.parse(salvo) as Partial<Arrumacao>) : null;
    return { ordem: lido?.ordem ?? [], pastas: lido?.pastas ?? [] };
  } catch {
    return { ordem: [], pastas: [] };
  }
}

function guardar(arrumacao: Arrumacao) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(arrumacao));
  } catch {
    /// Sem localStorage a arrumação vale só até recarregar — melhor que travar.
  }
}

export const usePastas = create<StoreDePastas>((set, store) => {
  const aplicar = (arrumacao: Arrumacao) => {
    set({ arrumacao });
    guardar(arrumacao);
  };

  return {
    arrumacao: ler(),
    mover: (guildIds, guildId, destino) => aplicar(moverServidor(guildIds, store().arrumacao, guildId, destino)),
    alternar: (pastaId) => aplicar(alternarPasta(store().arrumacao, pastaId)),
    editar: (pastaId, dados) => aplicar(editarPasta(store().arrumacao, pastaId, dados)),
    desfazer: (pastaId) => aplicar(desfazerPasta(store().arrumacao, pastaId)),
  };
});
