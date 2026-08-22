import type { FastifyInstance } from "fastify";
import multipart from "@fastify/multipart";
import { LIMITS, TETO_POR_FINALIDADE } from "@gravae/shared";
import { env } from "~/env.js";
import { AppError } from "~/lib/http.js";
import { uploadService } from "~/services/upload-service.js";
import { finalidadeDeUpload, importarImagemInput, presignInput } from "~/validations/upload.js";

export async function uploadRoutes(app: FastifyInstance) {
  await app.register(multipart, { limits: { fileSize: LIMITS.attachmentBytes, files: 1 } });

  app.addHook("preHandler", app.authenticate);

  /** Diz ao front por qual caminho enviar. */
  app.get("/uploads/config", () => ({ direct: env.R2_DIRECT_UPLOAD }));

  app.post("/uploads/presign", (req) => uploadService.presign(req.userId, presignInput.parse(req.body)));

  /** Traz pro nosso bucket uma imagem que ja esta na internet (o GIF do seletor). */
  app.post("/uploads/importar", (req) =>
    uploadService.importar(req.userId, importarImagemInput.parse(req.body)),
  );

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

    /**
     * O teto por finalidade também vale AQUI, e não só na URL assinada: hoje
     * este é o caminho em uso — o envio direto ao bucket depende de uma
     * política de CORS que ainda não existe. Um teto que só o outro caminho
     * respeita não é teto nenhum.
     */
    const purpose = finalidadeDeUpload.parse((req.query as { purpose?: string }).purpose);
    const teto = TETO_POR_FINALIDADE[purpose];

    if (body.length > teto) {
      throw new AppError(`Passa do limite de ${Math.round(teto / 1024)} KB para ${purpose}`, 413);
    }

    return uploadService.upload(req.userId, {
      filename: file.filename,
      contentType: file.mimetype || "application/octet-stream",
      body,
    });
  });
}
