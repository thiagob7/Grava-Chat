import type { Message } from "@gravae/shared";

import { api } from "~/@core/lib/api";

export interface ResultadoDaBusca extends Message {
  channelName: string;
  channelType: string;
}

export interface PaginaDaBusca {
  messages: ResultadoDaBusca[];
  hasMore: boolean;
}

/// Ou o servidor inteiro, ou uma conversa só — nunca nenhum dos dois.
export interface FiltrosDaBusca {
  guildId?: string;
  termo: string;
  canalId?: string;
  autorId?: string;
}

export async function buscarMensagens(
  filtros: FiltrosDaBusca,
  before?: string,
): Promise<PaginaDaBusca> {
  const response = await api.get<PaginaDaBusca>("/messages/busca", {
    params: {
      q: filtros.termo,
      guildId: filtros.guildId,
      canalId: filtros.canalId,
      autorId: filtros.autorId,
      before,
    },
  });

  return response.data;
}
