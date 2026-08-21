import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "~/env.js";
import type { PresignInput } from "~/validations/upload.js";

const s3 = new S3Client({
  region: env.R2_REGION,
  endpoint: env.R2_ENDPOINT,
  // O R2 aceita os dois estilos; o MinIO (fallback offline) só aceita path style.
  forcePathStyle: true,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
});

/** Tipos que o navegador exibe inline. Qualquer outra coisa vai como anexo. */
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"];

export const uploadService = {
  /**
   * O arquivo NÃO passa pela API: o browser faz PUT direto no storage com esta
   * URL assinada. Streamar 50 MB por dentro do Node só pra reenviar ao S3
   * consome memória e trava o event loop à toa.
   */
  isImage: (contentType: string) => IMAGE_TYPES.includes(contentType),

  /** Caminho da chave, isolando os arquivos deste app dentro do bucket. */
  buildKey(userId: string, filename: string) {
    const safeName = filename.replace(/[^\w.\-]/g, "_").slice(-100);
    return [env.R2_PREFIX, userId, randomUUID(), safeName].filter(Boolean).join("/");
  },

  publicUrl(key: string) {
    return `${env.R2_PUBLIC_URL}/${key}`;
  },

  /**
   * Recebe o arquivo e grava no storage.
   *
   * Usado quando o navegador NÃO pode falar direto com o bucket — o R2 recusa
   * PUT de outra origem enquanto não houver política de CORS configurada no
   * painel. Custa banda da API, então o caminho direto (presign) continua sendo
   * o preferido: é só ligar R2_DIRECT_UPLOAD depois de configurar o CORS.
   */
  async upload(userId: string, file: { filename: string; contentType: string; body: Buffer }) {
    const key = uploadService.buildKey(userId, file.filename);

    await s3.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: key,
        Body: file.body,
        ContentType: file.contentType,
      }),
    );

    return {
      id: key,
      url: uploadService.publicUrl(key),
      filename: file.filename,
      contentType: file.contentType,
      size: file.body.length,
    };
  },

  async presign(userId: string, input: PresignInput) {
    const key = uploadService.buildKey(userId, input.filename);

    const uploadUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: key,
        ContentType: input.contentType,
        ContentLength: input.size,
      }),
      { expiresIn: 300 },
    );

    return {
      uploadUrl,
      attachment: {
        id: key,
        url: uploadService.publicUrl(key),
        filename: input.filename,
        contentType: input.contentType,
        size: input.size,
      },
    };
  },
};
