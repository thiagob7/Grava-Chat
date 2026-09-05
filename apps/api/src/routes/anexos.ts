import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { env } from "~/env.js";
import { AppError } from "~/lib/http.js";

/// O mesmo teto do cliente: prévia é das primeiras linhas, não do arquivo
/// inteiro.
const MAIOR_TEXTO = 512 * 1024;

const consulta = z.object({ url: z.url() });

export async function anexoRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  /*
    O navegador não consegue baixar o anexo direto do R2: o bucket público não
    devolve CORS, e o token que temos não tem permissão para configurar isso.
    Então a prévia de texto passa por aqui.

    Só o nosso próprio bucket é aceito — a rota não serve de ponte para URL
    de terceiro.
  */
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
