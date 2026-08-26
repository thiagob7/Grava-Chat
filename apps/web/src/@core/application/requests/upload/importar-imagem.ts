import type { Attachment, FinalidadeDeUpload } from "@gravae/shared";
import { api } from "~/@core/lib/api";

export async function importarImagem(
  url: string,
  purpose: FinalidadeDeUpload,
): Promise<Attachment> {
  const resposta = await api.post<Attachment>("/uploads/importar", { url, purpose });
  return resposta.data;
}
