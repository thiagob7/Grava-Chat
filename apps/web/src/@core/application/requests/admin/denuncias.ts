import { api } from "~/@core/lib/api";

export interface QuemDenunciou {
  id: string;
  username: string;
  displayName: string;
}

export interface DenunciaNaFila {
  id: string;
  tipo: "comunidade" | "mensagem";
  motivo: string;
  motivoEscrito: string;
  detalhes: string | null;
  createdAt: string;
  resolvidaEm: string | null;
  decisao: string | null;
  autor: QuemDenunciou | null;
  comunidade: { id: string; nome: string } | null;
  mensagem: {
    id: string;
    channelId: string;
    guildId: string | null;
    trecho: string;
    autor: QuemDenunciou | null;
  } | null;
}

export type Desfecho = "procede" | "arquivada" | "reabrir";

export async function findDenuncias(params: { pendentes?: boolean; antesDe?: string }) {
  const response = await api.get<{ itens: DenunciaNaFila[]; proxima: string | null }>(
    "/admin/denuncias",
    { params },
  );

  return response.data;
}

export async function darDesfecho(denunciaId: string, decisao: Desfecho) {
  const response = await api.patch<{ id: string }>(`/admin/denuncias/${denunciaId}`, { decisao });
  return response.data;
}
