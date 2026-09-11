import type { Message } from "@gravae/shared";

import { api } from "~/@core/lib/api";

export interface SearchResult extends Message {
  channelName: string | null;
  channelType: string;
}

export interface SearchPage {
  messages: SearchResult[];
  hasMore: boolean;
}

export type SearchScope = "servidor" | "canal" | "comunidades" | "dms" | "tudo";

export interface SearchFilters {
  term: string;
  scope?: SearchScope;
  guildId?: string;
  channelId?: string;
  authorId?: string;
  mentionsId?: string;
  has?: "link" | "imagem" | "video" | "som" | "arquivo" | "anexo";
  after?: string;
  before?: string;
  em?: string;
  pinned?: boolean;
  authorKind?: "usuario" | "bot";
  order?: "recente" | "antiga";
}

export async function searchMessages(
  filters: SearchFilters,
  before?: string,
): Promise<SearchPage> {
  const { term, ...rest } = filters;
  const response = await api.get<SearchPage>("/messages/busca", {
    params: { q: term, ...rest, before },
  });

  return response.data;
}
