import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { env } from "~/env.js";
import { AppError } from "~/lib/http.js";

const MAIOR_TEXTO = 512 * 1024;

const consulta = z.object({ url: z.url() });

export async function anexoRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/anexos/texto", async (req) => {
    const { url } = consulta.parse(req.query);

    if (!url.startsWith(env.R2_PUBLIC_URL)) {
      throw new AppError("Esse arquivo não é daqui", 400);
    }

    const resposta = await fetch(url);
    if (!resposta.ok) throw new AppError("Não consegui ler o arquivo", 502);

    const tamanho = Number(resposta.headers.get("content-length") ?? 0);
    if (tamanho > MAIOR_TEXTO) throw new AppError("Arquivo grande demais para prévia", 413);

    const texto = await resposta.text();
    if (texto.length > MAIOR_TEXTO) {
      throw new AppError("Arquivo grande demais para prévia", 413);
    }

    return { conteudo: texto };
  });
}
