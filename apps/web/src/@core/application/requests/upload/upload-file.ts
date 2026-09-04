import type { Attachment, FinalidadeDeUpload } from "@gravae/shared";
import { api } from "~/@core/lib/api";

export async function uploadFile(
  file: File,
  finalidade: FinalidadeDeUpload = "anexo",
): Promise<Attachment> {
  const form = new FormData();
  form.append("file", file, file.name);

  const response = await api.post<Attachment>(`/uploads?purpose=${finalidade}`, form, {
    timeout: 0,
  });
  return response.data;
}
