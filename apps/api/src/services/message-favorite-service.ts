import { NotFoundError } from "~/lib/http.js";
import { toMessage } from "~/lib/serialize.js";
import { messageFavoriteRepository } from "~/repositories/message-favorite-repository.js";
import { messageRepository } from "~/repositories/message-repository.js";
import { accessService } from "~/services/access-service.js";

const LIMITE = 200;

export const messageFavoriteService = {
  /**
   * As mensagens salvas, da mais recente para a mais antiga.
   *
   * Cada uma passa pelo controle de acesso do canal: sair de um servidor não
   * apaga o que você favoritou lá, e a lista não pode virar uma porta dos
   * fundos para ler o que você não pode mais ver.
   */
  async listar(userId: string) {
    const salvas = await messageFavoriteRepository.findManyOf(userId, LIMITE);

    const visiveis = await Promise.all(
      salvas
        .filter((f) => f.message && !f.message.deletedAt)
        .map(async (f) => {
          const pode = await accessService
            .requireChannelAccess(userId, f.message.channelId)
            .then(() => true)
            .catch(() => false);

          return pode ? toMessage(f.message, userId) : null;
        }),
    );

    return visiveis.filter((m) => m !== null);
  },

  async idsDe(userId: string) {
    return (await messageFavoriteRepository.idsOf(userId)).map((f) => f.messageId);
  },

  async alternar(userId: string, messageId: string, favoritar: boolean) {
    const message = await messageRepository.findById(messageId);
    if (!message || message.deletedAt) throw new NotFoundError("Mensagem não encontrada");

    await accessService.requireChannelAccess(userId, message.channelId);

    if (favoritar) await messageFavoriteRepository.add(userId, messageId);
    else await messageFavoriteRepository.remove(userId, messageId);

    return messageFavoriteService.idsDe(userId);
  },
};
