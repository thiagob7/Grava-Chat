import { AppError } from "~/lib/http.js";
import { gifFavoriteRepository } from "~/repositories/gif-favorite-repository.js";
import type { Gif } from "~/services/gif-service.js";

const LIMITE = 200;

interface Salvo {
  gifId: string;
  descricao: string;
  url: string;
  preview: string;
  width: number;
  height: number;
}

const paraGif = (f: Salvo): Gif => ({
  id: f.gifId,
  descricao: f.descricao,
  url: f.url,
  preview: f.preview,
  width: f.width,
  height: f.height,
});

export const gifFavoriteService = {
  async listar(userId: string): Promise<Gif[]> {
    return (await gifFavoriteRepository.findManyOf(userId)).map(paraGif);
  },

  /// Guardar de novo o mesmo GIF não é erro: a estrela é um interruptor, e
  /// dois cliques rápidos não podem virar duas linhas nem um erro na cara.
  async salvar(userId: string, gif: Gif): Promise<Gif[]> {
    const atuais = await gifFavoriteRepository.findManyOf(userId);
    const jaTem = atuais.some((f) => f.gifId === gif.id);

    if (!jaTem && atuais.length >= LIMITE) {
      throw new AppError(`Você já tem ${LIMITE} GIFs salvos. Tire um antes de guardar outro.`, 400);
    }

    await gifFavoriteRepository.upsert({
      userId,
      gifId: gif.id,
      descricao: gif.descricao,
      url: gif.url,
      preview: gif.preview,
      width: gif.width,
      height: gif.height,
    });

    return gifFavoriteService.listar(userId);
  },

  async remover(userId: string, gifId: string): Promise<Gif[]> {
    await gifFavoriteRepository.deleteOne(userId, gifId);
    return gifFavoriteService.listar(userId);
  },
};
