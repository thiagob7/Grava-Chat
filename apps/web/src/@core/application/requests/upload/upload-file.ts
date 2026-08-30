import type { Attachment, FinalidadeDeUpload } from "@gravae/shared";
import { api } from "~/@core/lib/api";

export async function uploadFile(
  file: File,
  finalidade: FinalidadeDeUpload = "anexo",
): Promise<Attachment> {
  const form = new FormData();
  form.append("file", file, file.name);

  /// Sem prazo: o padrão de 30s do cliente derruba envio grande em conexão
  /// ruim, e o arquivo já está a caminho — cortar no meio só desperdiça o que
  /// já subiu.
  const response = await api.post<Attachment>(`/uploads?purpose=${finalidade}`, form, {
    timeout: 0,
  });
  return response.data;
}
