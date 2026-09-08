import { api } from "~/@core/lib/api";

export interface ComunicadoDTO {
  conteudo: string;
  /// Ausente é "todo mundo".
  userIds?: string[];
}

export async function mandarComunicado(data: ComunicadoDTO) {
  const response = await api.post<{ destinatarios: number }>("/admin/comunicados", data);
  return response.data;
}

export async function contarPessoas() {
  const response = await api.get<{ total: number }>("/admin/pessoas");
  return response.data;
}
