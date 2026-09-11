import type { Attachment, UploadPurpose } from "@gravae/shared";

import { findUploadConfig } from "~/@core/application/requests/upload/find-upload-config";
import { presignUpload } from "~/@core/application/requests/upload/presign-upload";
import { uploadFile } from "~/@core/application/requests/upload/upload-file";
import { resizeImage, type PreparedImage } from "~/lib/image";

let setting: Promise<{ direct: boolean }> | null = null;
const getSetting = () => (setting ??= findUploadConfig().catch(() => ({ direct: false })));

export async function uploadImage(
  file: File,
  { maxSize, purpose = "anexo" }: { maxSize: number; purpose?: UploadPurpose },
): Promise<{ attachment: Attachment; originalSize: number; uploadedSize: number }> {
  const prepared: PreparedImage = await resizeImage(file, { maxSize });
  const kind = prepared.file.type || "application/octet-stream";

  const { direct } = await getSetting();

  const attachment = direct
    ? await sendDirect(prepared, kind, purpose)
    : await uploadFile(prepared.file, purpose);

  return {
    attachment: { ...attachment, width: prepared.width, height: prepared.height },
    originalSize: file.size,
    uploadedSize: prepared.file.size,
  };
}

async function sendDirect(
  prepared: PreparedImage,
  kind: string,
  purpose: UploadPurpose,
): Promise<Attachment> {
  const { uploadUrl, attachment } = await presignUpload({
    filename: prepared.file.name,
    contentType: kind,
    size: prepared.file.size,
    purpose: purpose,
  });

  const reply = await fetch(uploadUrl, {
    method: "PUT",
    body: prepared.file,
    headers: { "Content-Type": kind },
  });

  if (!reply.ok) throw new Error(`storage respondeu ${reply.status}`);
  return attachment;
}

export async function sendFile(file: File): Promise<Attachment> {
  const { direct } = await getSetting();
  if (!direct) return sendFile(file);

  const kind = file.type || "application/octet-stream";
  const { uploadUrl, attachment } = await presignUpload({
    filename: file.name,
    contentType: kind,
    size: file.size,
  });

  const reply = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": kind },
  });

  if (!reply.ok) throw new Error(`storage respondeu ${reply.status}`);
  return attachment;
}
