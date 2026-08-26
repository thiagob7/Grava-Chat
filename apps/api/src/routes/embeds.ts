import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { embedService } from "~/services/embed-service.js";

const consulta = z.object({ url: z.string().url().max(2048) });

export async function embedRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  /*
    O cartão de um link.

    Quem busca é o servidor, nunca o navegador: a página do outro lado não
    manda CORS para nós, e mesmo que mandasse, cada pessoa na conversa faria
    a sua própria visita ao site. Aqui é uma busca só, guardada em memória,
    servida para todo mundo.
  */
  app.get("/embeds", async (req, reply) => {
    const { url } = consulta.parse(req.query);
    const embed = await embedService.resolver(url);

    /// O cartão de um link não muda de minuto em minuto; o navegador pode
    /// segurar o dele.
    reply.header("cache-control", "private, max-age=600");
    return { embed };
  });
}
