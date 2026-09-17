import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "~/env.js";
import { CEILING_BY_PURPOSE, type UploadPurpose } from "@gravae/shared";
import { AppError } from "~/lib/http.js";
import { redis, keys } from "~/lib/redis.js";
import { fitsQuota, quotaMessage, QUOTA_S_WINDOW } from "~/lib/cota-de-upload.js";
import { planService } from "~/services/plan-service.js";
import type { ImportImageInput, PresignInput } from "~/validations/upload.js";

const s3 = new S3Client({
  region: env.R2_REGION,
  endpoint: env.R2_ENDPOINT,
  forcePathStyle: true,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
});

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"];

const RENDERED_BY_BROWSER = /^(text\/html|application\/xhtml\+xml|image\/svg\+xml|text\/xml|application\/xml|(application|text)\/(x-)?javascript)\b/i;

function storedType(contentType: string, purpose: UploadPurpose) {
  const clean = contentType.split(";")[0]!.trim().toLowerCase();

  if (purpose !== "anexo") {
    if (!IMAGE_TYPES.includes(clean)) throw new AppError("Isso não é uma imagem aceita", 400);
    return clean;
  }

  if (RENDERED_BY_BROWSER.test(clean)) return "text/plain";
  return /^[\w.+-]+\/[\w.+-]+$/.test(clean) ? clean : "application/octet-stream";
}

export const uploadService = {
  isImage: (contentType: string) => IMAGE_TYPES.includes(contentType),

  async reserveQuota(userId: string, size: number) {
    const key = keys.uploadQuota(userId);

    const alreadyUsed = (await redis.get(key).then(Number).catch(() => 0)) || 0;
    const quota = await planService.uploadQuotaOf(userId, alreadyUsed + size);

    if (!fitsQuota({ alreadyUsed, size, quota })) {
      throw new AppError(quotaMessage({ alreadyUsed, quota }), 429);
    }

    await redis
      .multi()
      .incrby(key, size)
      .expire(key, QUOTA_S_WINDOW, "NX")
      .exec()
      .catch(() => undefined);
  },

  buildKey(userId: string, filename: string) {
    const safeName = filename.replace(/[^\w.\-]/g, "_").slice(-100);
    return [env.R2_PREFIX, userId, randomUUID(), safeName].filter(Boolean).join("/");
  },

  ownsKey(userId: string, key: string) {
    const base = [env.R2_PREFIX, userId].filter(Boolean).join("/") + "/";
    return key.startsWith(base) && !key.includes("..");
  },

  publicUrl(key: string) {
    return `${env.R2_PUBLIC_URL}/${key}`;
  },

  async upload(
    userId: string,
    file: { filename: string; contentType: string; body: Buffer },
    purpose: UploadPurpose = "anexo",
  ) {
    file = { ...file, contentType: storedType(file.contentType, purpose) };
    await uploadService.reserveQuota(userId, file.body.length);

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

  async remove(keys: string[]) {
    if (!keys.length) return;

    for (let i = 0; i < keys.length; i += 1000) {
      await s3
        .send(
          new DeleteObjectsCommand({
            Bucket: env.R2_BUCKET,
            Delete: { Objects: keys.slice(i, i + 1000).map((Key) => ({ Key })), Quiet: true },
          }),
        )
        .catch((error: unknown) => {
          console.error("[r2] nao consegui apagar anexos:", (error as Error).message);
        });
    }
  },

  async doImport(userId: string, input: ImportImageInput) {
    const ceiling = CEILING_BY_PURPOSE[input.purpose];

    const reply = await fetch(input.url, { redirect: "error", signal: AbortSignal.timeout(10_000) }).catch(() => null);
    if (!reply?.ok) throw new AppError("Nao consegui baixar essa imagem", 502);

    const announced = Number(reply.headers.get("content-length") ?? 0);
    if (announced > ceiling) throw new AppError(`A imagem passa de ${Math.round(ceiling / 1024)} KB`, 413);

    const contentType = reply.headers.get("content-type") ?? "";
    if (!uploadService.isImage(contentType)) throw new AppError("Isso nao e uma imagem");

    const body = Buffer.from(await reply.arrayBuffer());
    if (body.length > ceiling) throw new AppError(`A imagem passa de ${Math.round(ceiling / 1024)} KB`, 413);

    const extension = contentType.split("/")[1]?.split(";")[0] ?? "gif";

    return uploadService.upload(
      userId,
      { filename: `importada.${extension}`, contentType, body },
      input.purpose,
    );
  },

  async presign(userId: string, input: PresignInput) {
    input = { ...input, contentType: storedType(input.contentType, input.purpose) };
    if (input.purpose === "anexo") await planService.requireAttachmentSize(userId, input.size);
    await uploadService.reserveQuota(userId, input.size);

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
