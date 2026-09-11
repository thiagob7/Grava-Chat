import { api } from "~/@core/lib/api";

export interface WhoReported {
  id: string;
  username: string;
  displayName: string;
}

export interface ReportQueue {
  id: string;
  kind: "comunidade" | "mensagem";
  reason: string;
  reasonWritten: string;
  details: string | null;
  createdAt: string;
  resolvedAt: string | null;
  decision: string | null;
  author: WhoReported | null;
  community: { id: string; name: string } | null;
  message: {
    id: string;
    channelId: string;
    guildId: string | null;
    snippet: string;
    author: WhoReported | null;
  } | null;
}

export type Outcome = "procede" | "arquivada" | "reabrir";

export async function findReports(params: { pending?: boolean; before?: string }) {
  const response = await api.get<{ items: ReportQueue[]; next: string | null }>(
    "/admin/denuncias",
    { params },
  );

  return response.data;
}

export async function giveOutcome(reportId: string, decision: Outcome) {
  const response = await api.patch<{ id: string }>(`/admin/denuncias/${reportId}`, { decision });
  return response.data;
}
