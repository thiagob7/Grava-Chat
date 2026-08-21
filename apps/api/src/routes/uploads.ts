import type { FastifyInstance } from "fastify";
import multipart from "@fastify/multipart";
import { LIMITS } from "@gravae/shared";
import { env } from "~/env.js";
import { AppError } from "~/lib/http.js";
import { uploadService } from "~/services/upload-service.js";
import { presignInput } from "~/validations/upload.js";

export async function uploadRoutes(app: FastifyInstance) {
  await app.register(multipart, { limits: { fileSize: LIMITS.attachmentBytes, files: 1 } });

  app.addHook("preHandler", app.authenticate);

  /** Diz ao front por qual caminho enviar. */
  app.get("/uploads/config", () => ({ direct: env.R2_DIRECT_UPLOAD }));

  app.post("/uploads/presign", (req) => uploadService.presign(req.userId, presignInput.parse(req.body)));

  /**
   * Envio através da API, para quando o navegador não pode falar direto com o
   * bucket (sem política de CORS no R2).
   */
  app.post("/uploads", async (req) => {
    const file = await req.file();
    if (!file) throw new AppError("Nenhum arquivo enviado");

    const body = await file.toBuffer();

    // O @fastify/multipart trunca em vez de falhar; sem esta checagem o arquivo
    // subiria pela metade e a pessoa só descobriria ao abrir.
    if (file.file.truncated) throw new AppError("Arquivo passa do limite de 50 MB", 413);

    return uploadService.upload(req.userId, {
      filename: file.filename,
      contentType: file.mimetype || "application/octet-stream",
      body,
    });
  });
}
