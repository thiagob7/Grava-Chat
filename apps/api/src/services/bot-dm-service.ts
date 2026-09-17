import { rooms } from "@gravae/shared";

import { AppError, ForbiddenError, NotFoundError } from "~/lib/http.js";
import { keys, redis } from "~/lib/redis.js";
import { io } from "~/realtime/io.js";
import { mutualRepository } from "~/repositories/friendship-repository.js";
import { userRepository } from "~/repositories/user-repository.js";
import { friendshipService } from "./friendship-service.js";

const DM_WINDOW_S = 60;
const DMS_PER_WINDOW = 30;

export const botDmService = {
  async openFor(botUserId: string, targetId: string) {
    if (targetId === botUserId) throw new AppError("A bot cannot message itself");

    const target = await userRepository.findById(targetId);
    if (!target || target.system) throw new NotFoundError("User not found");
    if (target.isBot) throw new ForbiddenError("Bots cannot send direct messages to other bots");

    const inCommon = await mutualRepository.guildIdsInCommon(botUserId, targetId);
    if (!inCommon.length) {
      throw new ForbiddenError("The bot can only message people who share a server with it");
    }

    const uses = await redis.incr(keys.botDmRate(botUserId));
    if (uses === 1) await redis.expire(keys.botDmRate(botUserId), DM_WINDOW_S);
    if (uses > DMS_PER_WINDOW) throw new AppError("Too many direct messages in a row", 429);

    const { channel, request, silent } = await friendshipService.openDm(botUserId, targetId);

    if (!silent) {
      io().to(rooms.user(targetId)).emit(request ? "dm:pedido" : "dm:created", { channelId: channel.id });
    }

    return channel.id;
  },
};
