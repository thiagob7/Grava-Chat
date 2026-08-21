import type { Attachment } from "@gravae/shared";
import type { PresignUploadDTO } from "~/@core/domain/dtos/message-dto";
import { api } from "~/@core/lib/api";

export async function presignUpload(
  data: PresignUploadDTO,
): Promise<{ uploadUrl: string; attachment: Attachment }> {
  const response = await api.post<{ uploadUrl: string; attachment: Attachment }>(
    "/uploads/presign",
    data,
  );

  return response.data;
}
