import type { Attachment, FinalidadeDeUpload } from "@gravae/shared";

import { findUploadConfig } from "~/@core/application/requests/upload/find-upload-config";
import { presignUpload } from "~/@core/application/requests/upload/presign-upload";
import { uploadFile } from "~/@core/application/requests/upload/upload-file";
import { resizeImage, type PreparedImage } from "~/lib/image";

let configuracao: Promise<{ direct: boolean }> | null = null;
const obterConfiguracao = () => (configuracao ??= findUploadConfig().catch(() => ({ direct: false })));

export async function uploadImage(
  file: File,
  { maxSize, finalidade = "anexo" }: { maxSize: number; finalidade?: FinalidadeDeUpload },
): Promise<{ attachment: Attachment; originalSize: number; uploadedSize: number }> {
  const preparada: PreparedImage = await resizeImage(file, { maxSize });
  const tipo = preparada.file.type || "application/octet-stream";

  const { direct } = await obterConfiguracao();

  const attachment = direct
    ? await enviarDireto(preparada, tipo, finalidade)
    : await uploadFile(preparada.file, finalidade);

  return {
    attachment: { ...attachment, width: preparada.width, height: preparada.height },
    originalSize: file.size,
    uploadedSize: preparada.file.size,
  };
}

async function enviarDireto(
  preparada: PreparedImage,
  tipo: string,
  finalidade: FinalidadeDeUpload,
): Promise<Attachment> {
  const { uploadUrl, attachment } = await presignUpload({
    filename: preparada.file.name,
    contentType: tipo,
    size: preparada.file.size,
    purpose: finalidade,
  });

  const resposta = await fetch(uploadUrl, {
    method: "PUT",
    body: preparada.file,
    headers: { "Content-Type": tipo },
  });

  if (!resposta.ok) throw new Error(`storage respondeu ${resposta.status}`);
  return attachment;
}

export async function uploadArquivo(file: File): Promise<Attachment> {
  const { direct } = await obterConfiguracao();
  if (!direct) return uploadFile(file);

  const tipo = file.type || "application/octet-stream";
  const { uploadUrl, attachment } = await presignUpload({
    filename: file.name,
    contentType: tipo,
    size: file.size,
  });

  const resposta = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": tipo },
  });

  if (!resposta.ok) throw new Error(`storage respondeu ${resposta.status}`);
  return attachment;
}
