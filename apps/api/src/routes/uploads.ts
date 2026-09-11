import type { FastifyInstance } from "fastify";
import multipart from "@fastify/multipart";
import { LIMITS, CEILING_BY_PURPOSE } from "@gravae/shared";
import { env } from "~/env.js";
import { AppError } from "~/lib/http.js";
import { uploadService } from "~/services/upload-service.js";
import { uploadPurpose, importImageInput, presignInput } from "~/validations/upload.js";

export async function uploadRoutes(app: FastifyInstance) {
  await app.register(multipart, { limits: { fileSize: LIMITS.attachmentBytes, files: 1 } });

  app.addHook("preHandler", app.authenticate);

  app.get("/uploads/config", () => ({ direct: env.R2_DIRECT_UPLOAD }));

  app.post("/uploads/presign", (req) => uploadService.presign(req.userId, presignInput.parse(req.body)));

  app.post("/uploads/importar", (req) =>
    uploadService.doImport(req.userId, importImageInput.parse(req.body)),
  );

  app.post("/uploads", async (req) => {
    const file = await req.file();
    if (!file) throw new AppError("Nenhum arquivo enviado");

    const body = await file.toBuffer();

    if (file.file.truncated) throw new AppError("Arquivo passa do limite de 50 MB", 413);

    const purpose = uploadPurpose.parse((req.query as { purpose?: string }).purpose);
    const ceiling = CEILING_BY_PURPOSE[purpose];

    if (body.length > ceiling) {
      throw new AppError(`Passa do limite de ${Math.round(ceiling / 1024)} KB para ${purpose}`, 413);
    }

    return uploadService.upload(req.userId, {
      filename: file.filename,
      contentType: file.mimetype || "application/octet-stream",
      body,
    });
  });
}
