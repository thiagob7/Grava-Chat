import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { gifFavoriteService } from "~/services/gif-favorite-service.js";
import { gifService } from "~/services/gif-service.js";

const searchQuery = z.object({
  q: z.string().min(1).max(64),
  limit: z.coerce.number().int().min(1).max(50).default(30),
});

const favoriteBody = z.object({
  id: z.string().min(1).max(64),
  description: z.string().max(300).default("GIF"),
  url: z.string().url(),
  preview: z.string().url(),
  width: z.coerce.number().int().min(0).default(0),
  height: z.coerce.number().int().min(0).default(0),
});

export async function gifRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/gifs/config", () => ({ available: gifService.available() }));

  app.get("/gifs/alta", () => gifService.inHigh());

  app.get("/gifs/categorias", () => gifService.categories());

  app.get("/gifs/busca", (req) => {
    const { q, limit } = searchQuery.parse(req.query);
    return gifService.search(q, limit);
  });

  app.get("/gifs/favoritos", (req) => gifFavoriteService.list(req.userId));

  app.post("/gifs/favoritos", (req) =>
    gifFavoriteService.save(req.userId, favoriteBody.parse(req.body)),
  );

  app.delete("/gifs/favoritos/:gifId", (req) => {
    const { gifId } = z.object({ gifId: z.string().min(1).max(64) }).parse(req.params);
    return gifFavoriteService.remove(req.userId, gifId);
  });
}
