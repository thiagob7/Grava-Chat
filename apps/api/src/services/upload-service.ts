import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "~/env.js";
import { TETO_POR_FINALIDADE } from "@gravae/shared";
import { AppError } from "~/lib/http.js";
import type { ImportarImagemInput, PresignInput } from "~/validations/upload.js";

const s3 = new S3Client({
  region: env.R2_REGION,
  endpoint: env.R2_ENDPOINT,
  forcePathStyle: true,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
});

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"];

export const uploadService = {
  isImage: (contentType: string) => IMAGE_TYPES.includes(contentType),

  buildKey(userId: string, filename: string) {
    const safeName = filename.replace(/[^\w.\-]/g, "_").slice(-100);
    return [env.R2_PREFIX, userId, randomUUID(), safeName].filter(Boolean).join("/");
  },

  publicUrl(key: string) {
    return `${env.R2_PUBLIC_URL}/${key}`;
  },

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

  async importar(userId: string, input: ImportarImagemInput) {
    const teto = TETO_POR_FINALIDADE[input.purpose];

    const resposta = await fetch(input.url, { signal: AbortSignal.timeout(10_000) }).catch(() => null);
    if (!resposta?.ok) throw new AppError("Nao consegui baixar essa imagem", 502);

    const anunciado = Number(resposta.headers.get("content-length") ?? 0);
    if (anunciado > teto) throw new AppError(`A imagem passa de ${Math.round(teto / 1024)} KB`, 413);

    const contentType = resposta.headers.get("content-type") ?? "";
    if (!uploadService.isImage(contentType)) throw new AppError("Isso nao e uma imagem");

    const body = Buffer.from(await resposta.arrayBuffer());
    if (body.length > teto) throw new AppError(`A imagem passa de ${Math.round(teto / 1024)} KB`, 413);

    const extensao = contentType.split("/")[1]?.split(";")[0] ?? "gif";

    return uploadService.upload(userId, {
      filename: `importada.${extensao}`,
      contentType,
      body,
    });
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
