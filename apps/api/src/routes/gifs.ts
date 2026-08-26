import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { gifFavoriteService } from "~/services/gif-favorite-service.js";
import { gifService } from "~/services/gif-service.js";

const buscaQuery = z.object({
  q: z.string().min(1).max(64),
  limit: z.coerce.number().int().min(1).max(50).default(30),
});

const favoritoBody = z.object({
  id: z.string().min(1).max(64),
  descricao: z.string().max(300).default("GIF"),
  url: z.string().url(),
  preview: z.string().url(),
  width: z.coerce.number().int().min(0).default(0),
  height: z.coerce.number().int().min(0).default(0),
});

export async function gifRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/gifs/config", () => ({ disponivel: gifService.disponivel() }));

  app.get("/gifs/alta", () => gifService.emAlta());

  app.get("/gifs/categorias", () => gifService.categorias());

  app.get("/gifs/busca", (req) => {
    const { q, limit } = buscaQuery.parse(req.query);
    return gifService.buscar(q, limit);
  });

  app.get("/gifs/favoritos", (req) => gifFavoriteService.listar(req.userId));

  app.post("/gifs/favoritos", (req) =>
    gifFavoriteService.salvar(req.userId, favoritoBody.parse(req.body)),
  );

  app.delete("/gifs/favoritos/:gifId", (req) => {
    const { gifId } = z.object({ gifId: z.string().min(1).max(64) }).parse(req.params);
    return gifFavoriteService.remover(req.userId, gifId);
  });
}
