import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { gifService } from "~/services/gif-service.js";

const buscaQuery = z.object({
  q: z.string().min(1).max(64),
  limit: z.coerce.number().int().min(1).max(50).default(30),
});

export async function gifRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  /** A tela pergunta antes de mostrar a aba: sem chave, ela explica o que falta. */
  app.get("/gifs/config", () => ({ disponivel: gifService.disponivel() }));

  app.get("/gifs/alta", () => gifService.emAlta());

  app.get("/gifs/busca", (req) => {
    const { q, limit } = buscaQuery.parse(req.query);
    return gifService.buscar(q, limit);
  });
}
