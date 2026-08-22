import type { Attachment, FinalidadeDeUpload } from "@gravae/shared";

import { findUploadConfig } from "~/@core/application/requests/upload/find-upload-config";
import { presignUpload } from "~/@core/application/requests/upload/presign-upload";
import { uploadFile } from "~/@core/application/requests/upload/upload-file";
import { resizeImage, type PreparedImage } from "~/lib/image";

/**
 * A configuração muda raramente (é uma env do servidor); buscar uma vez por
 * sessão evita um request extra a cada anexo.
 */
let configuracao: Promise<{ direct: boolean }> | null = null;
const obterConfiguracao = () => (configuracao ??= findUploadConfig().catch(() => ({ direct: false })));

/**
 * Comprime e envia, escolhendo o caminho conforme o servidor.
 *
 * Direto no bucket é mais barato (o binário não passa pela API), mas exige
 * política de CORS no R2. Enquanto não houver, vai pela API.
 */
export async function uploadImage(
  file: File,
  { maxSize, finalidade = "anexo" }: { maxSize: number; finalidade?: FinalidadeDeUpload },
): Promise<{ attachment: Attachment; originalSize: number; uploadedSize: number }> {
  const preparada: PreparedImage = await resizeImage(file, { maxSize });
  const tipo = preparada.file.type || "application/octet-stream";

  const { direct } = await obterConfiguracao();

  /**
   * A finalidade viaja com o arquivo porque é ela que escolhe o teto de bytes
   * no servidor. Sem ela, uma foto de perfil herda o teto de anexo — cinquenta
   * megabytes para algo desenhado a 72 pixels.
   */
  const attachment = direct
    ? await enviarDireto(preparada, tipo, finalidade)
    : await uploadFile(preparada.file, finalidade);

  return {
    // dimensões vão junto: o chat reserva o espaço antes da imagem carregar
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

/**
 * Envia o arquivo como está, sem passar pelo redimensionador.
 *
 * Serve pra som (que não é imagem) e pra figurinha/emoji, onde a transparência
 * e a animação do PNG/GIF precisam sobreviver — o canvas do `resizeImage`
 * achataria as duas coisas.
 */
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
