import { AppError } from "~/lib/http.js";
import { gifFavoriteRepository } from "~/repositories/gif-favorite-repository.js";
import type { Gif } from "~/services/gif-service.js";

const LIMIT = 200;

interface Saved {
  gifId: string;
  description: string;
  url: string;
  preview: string;
  width: number;
  height: number;
}

const forGif = (f: Saved): Gif => ({
  id: f.gifId,
  description: f.description,
  url: f.url,
  preview: f.preview,
  width: f.width,
  height: f.height,
});

export const gifFavoriteService = {
  async list(userId: string): Promise<Gif[]> {
    return (await gifFavoriteRepository.findManyOf(userId)).map(forGif);
  },

  async save(userId: string, gif: Gif): Promise<Gif[]> {
    const current = await gifFavoriteRepository.findManyOf(userId);
    const alreadyHas = current.some((f) => f.gifId === gif.id);

    if (!alreadyHas && current.length >= LIMIT) {
      throw new AppError(`Você já tem ${LIMIT} GIFs salvos. Tire um antes de guardar outro.`, 400);
    }

    await gifFavoriteRepository.upsert({
      userId,
      gifId: gif.id,
      description: gif.description,
      url: gif.url,
      preview: gif.preview,
      width: gif.width,
      height: gif.height,
    });

    return gifFavoriteService.list(userId);
  },

  async remove(userId: string, gifId: string): Promise<Gif[]> {
    await gifFavoriteRepository.deleteOne(userId, gifId);
    return gifFavoriteService.list(userId);
  },
};
