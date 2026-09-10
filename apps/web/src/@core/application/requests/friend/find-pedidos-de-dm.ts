import type { PedidoDeDm } from "@gravae/shared";
import { api } from "~/@core/lib/api";

export interface CaixaDePedidos {
  pedidos: PedidoDeDm[];
  spam: PedidoDeDm[];
}

export async function findPedidosDeDm(): Promise<CaixaDePedidos> {
  const response = await api.get<CaixaDePedidos>("/dms/pedidos");
  return response.data;
}
