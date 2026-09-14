import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { isR2Url } from "~/lib/r2-url.js";
import { AppError } from "~/lib/http.js";

const LARGER_TEXT = 512 * 1024;

const query = z.object({ url: z.url() });

export async function attachmentRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/anexos/texto", async (req) => {
    const { url } = query.parse(req.query);

    if (!isR2Url(url)) {
      throw new AppError("Esse arquivo não é daqui", 400);
    }

    const reply = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(10_000) }).catch(() => null);
    if (!reply?.ok) throw new AppError("Não consegui ler o arquivo", 502);

    const size = Number(reply.headers.get("content-length") ?? 0);
    if (size > LARGER_TEXT) throw new AppError("Arquivo grande demais para prévia", 413);

    const text = await reply.text();
    if (text.length > LARGER_TEXT) {
      throw new AppError("Arquivo grande demais para prévia", 413);
    }

    return { content: text };
  });
}
