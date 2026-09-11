import type { Attachment, UploadPurpose } from "@gravae/shared";
import { api } from "~/@core/lib/api";

export async function importImage(
  url: string,
  purpose: UploadPurpose,
): Promise<Attachment> {
  const reply = await api.post<Attachment>("/uploads/importar", { url, purpose });
  return reply.data;
}
