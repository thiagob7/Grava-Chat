import type { Message } from "@gravae/shared";

import { api } from "~/@core/lib/api";

export interface ResultadoDaBusca extends Message {
  channelName: string | null;
  channelType: string;
}

export interface PaginaDaBusca {
  messages: ResultadoDaBusca[];
  hasMore: boolean;
}

export type EscopoDeBusca = "servidor" | "canal" | "comunidades" | "dms" | "tudo";

/// O que se manda para a API: o texto, o escopo e cada filtro já resolvido em id.
export interface FiltrosDaBusca {
  termo: string;
  escopo?: EscopoDeBusca;
  guildId?: string;
  canalId?: string;
  autorId?: string;
  mencionaId?: string;
  tem?: "link" | "imagem" | "video" | "som" | "arquivo" | "anexo";
  depois?: string;
  antes?: string;
  em?: string;
  fixada?: boolean;
  tipoDeAutor?: "usuario" | "bot";
  ordem?: "recente" | "antiga";
}

export async function buscarMensagens(
  filtros: FiltrosDaBusca,
  before?: string,
): Promise<PaginaDaBusca> {
  const { termo, ...resto } = filtros;
  const response = await api.get<PaginaDaBusca>("/messages/busca", {
    params: { q: termo, ...resto, before },
  });

  return response.data;
}
