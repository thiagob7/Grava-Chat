import type { DmRequest } from "@gravae/shared";
import { api } from "~/@core/lib/api";

export interface RequestsBox {
  requests: DmRequest[];
  spam: DmRequest[];
}

export async function findDmRequests(): Promise<RequestsBox> {
  const response = await api.get<RequestsBox>("/dms/pedidos");
  return response.data;
}
