import type { DesiredStatus, PresenceStatus } from "@gravae/shared";
import { redis, keys } from "~/lib/redis.js";
import { userRepository } from "~/repositories/user-repository.js";

const IDLE_TTL_S = 15 * 60;

export function visible(
  desired: DesiredStatus | null,
  online: boolean,
  idle: boolean,
): PresenceStatus {
  if (!online) return "OFFLINE";
  if (desired === "INVISIBLE") return "OFFLINE";
  if (desired === "DND") return "DND";
  if (idle) return "IDLE";

  return desired ?? "ONLINE";
}

export const presenceService = {
  visible,

  async onConnect(userId: string) {
    const count = await redis.incr(keys.sessions(userId));
    await redis.expire(keys.sessions(userId), 60 * 60 * 24);

    if (count !== 1) return null;

    const desired = (await redis.get(keys.presence(userId))) as DesiredStatus | null;
    const projetado = visible(desired, true, false);

    await presenceService.cache(userId, projetado);
    return projetado;
  },

  async onDisconnect(userId: string) {
    const count = await redis.decr(keys.sessions(userId));
    if (count > 0) return null;

    await redis.del(keys.sessions(userId), keys.idle(userId));
    await presenceService.cache(userId, "OFFLINE");
    return "OFFLINE" as const;
  },

  async setDesired(userId: string, desired: DesiredStatus) {
    await redis.set(keys.presence(userId), desired);
  },

  async cache(userId: string, status: PresenceStatus) {
    await userRepository.updatePresenceCache(userId, status);
  },

  async desiredOf(userId: string): Promise<DesiredStatus> {
    return ((await redis.get(keys.presence(userId))) as DesiredStatus | null) ?? "ONLINE";
  },

  async setIdle(userId: string, idle: boolean) {
    if (idle) await redis.set(keys.idle(userId), "1", "EX", IDLE_TTL_S);
    else await redis.del(keys.idle(userId));
  },

  async mapFor(userIds: string[]): Promise<Record<string, PresenceStatus>> {
    if (!userIds.length) return {};

    const pipeline = redis.pipeline();
    for (const id of userIds) {
      pipeline.exists(keys.sessions(id));
      pipeline.get(keys.presence(id));
      pipeline.exists(keys.idle(id));
    }

    const results = await pipeline.exec();
    const map: Record<string, PresenceStatus> = {};

    userIds.forEach((id, i) => {
      const online = Number(results?.[i * 3]?.[1] ?? 0) > 0;
      const desired = results?.[i * 3 + 1]?.[1] as DesiredStatus | null;
      const idle = Number(results?.[i * 3 + 2]?.[1] ?? 0) > 0;

      map[id] = visible(desired, online, idle);
    });

    return map;
  },

  async reset() {
    await userRepository.setAllOffline();
    const stale = await redis.keys("sessions:*");
    const idles = await redis.keys("idle:*");
    if (stale.length || idles.length) await redis.del(...stale, ...idles);
  },
};
