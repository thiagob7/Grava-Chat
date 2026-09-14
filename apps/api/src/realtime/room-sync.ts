import { rooms } from "@gravae/shared";

import { channelRepository } from "~/repositories/guild-repository.js";
import { accessService } from "~/services/access-service.js";
import { io } from "~/realtime/io.js";

export async function syncGuildRooms(guildId: string, userIds?: string[]) {
  const target = userIds ? userIds.map(rooms.user) : rooms.guild(guildId);
  const [sockets, channels] = await Promise.all([
    io().in(target).fetchSockets(),
    channelRepository.findManyByGuild(guildId),
  ]);

  const channelRooms = channels.map((c) => rooms.channel(c.id));
  const byUser = new Map<string, typeof sockets>();
  for (const socket of sockets) {
    byUser.set(socket.data.userId, [...(byUser.get(socket.data.userId) ?? []), socket]);
  }

  await Promise.all(
    [...byUser].map(async ([userId, userSockets]) => {
      const readable = await accessService
        .readableChannels(userId, guildId, { withHistory: false })
        .catch(() => null);

      for (const socket of userSockets) {
        if (!readable) {
          socket.leave(rooms.guild(guildId));
          for (const room of channelRooms) socket.leave(room);
          continue;
        }

        const allowed = new Set(readable.map(rooms.channel));
        for (const room of channelRooms) {
          if (allowed.has(room)) socket.join(room);
          else socket.leave(room);
        }
      }
    }),
  );
}

export function dropUserSockets(userId: string) {
  io().in(rooms.user(userId)).disconnectSockets(true);
}
