import type { Attachment, FinalidadeDeUpload } from "@gravae/shared";
import { api } from "~/@core/lib/api";

/**
 * Envia o arquivo através da API.
 *
 * Caminho usado quando o navegador não pode falar direto com o bucket. Custa
 * banda da API, então o presign continua sendo o preferido — ver
 * `R2_DIRECT_UPLOAD` no backend.
 */
export async function uploadFile(
  file: File,
  finalidade: FinalidadeDeUpload = "anexo",
): Promise<Attachment> {
  const form = new FormData();
  form.append("file", file, file.name);

  // na query, e não no corpo: o corpo é multipart e o servidor precisa do teto
  // ANTES de decidir se aceita os bytes
  const response = await api.post<Attachment>(`/uploads?purpose=${finalidade}`, form);
  return response.data;
}
