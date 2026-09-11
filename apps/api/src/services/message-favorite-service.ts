import { NotFoundError } from "~/lib/http.js";
import { toMessage } from "~/lib/serialize.js";
import { messageFavoriteRepository } from "~/repositories/message-favorite-repository.js";
import { messageRepository } from "~/repositories/message-repository.js";
import { accessService } from "~/services/access-service.js";

const LIMIT = 200;

export const messageFavoriteService = {
  async list(userId: string) {
    const saved = await messageFavoriteRepository.findManyOf(userId, LIMIT);

    const visible = await Promise.all(
      saved
        .filter((f) => f.message && !f.message.deletedAt)
        .map(async (f) => {
          const can = await accessService
            .requireChannelAccess(userId, f.message.channelId)
            .then(() => true)
            .catch(() => false);

          return can ? toMessage(f.message, userId) : null;
        }),
    );

    return visible.filter((m) => m !== null);
  },

  async idsDe(userId: string) {
    return (await messageFavoriteRepository.idsOf(userId)).map((f) => f.messageId);
  },

  async toggle(userId: string, messageId: string, favorite: boolean) {
    const message = await messageRepository.findById(messageId);
    if (!message || message.deletedAt) throw new NotFoundError("Mensagem não encontrada");

    await accessService.requireChannelAccess(userId, message.channelId);

    if (favorite) await messageFavoriteRepository.add(userId, messageId);
    else await messageFavoriteRepository.remove(userId, messageId);

    return messageFavoriteService.idsDe(userId);
  },
};
