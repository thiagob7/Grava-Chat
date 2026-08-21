import type { PresenceStatus } from "@gravae/shared";
import { redis, keys } from "~/lib/redis.js";
import { userRepository } from "~/repositories/user-repository.js";

/**
 * O Redis é a fonte da verdade da presença; o campo no Mongo é só cache do
 * último estado conhecido. Presença é efêmera e tem que sumir sozinha se o
 * processo cair.
 */
export const presenceService = {
  /**
   * Contagem por socket, não por usuário: ele pode ter 3 abas mais o app
   * desktop, e só fica offline quando a última cair.
   */
  async onConnect(userId: string) {
    const count = await redis.incr(keys.sessions(userId));
    await redis.expire(keys.sessions(userId), 60 * 60 * 24);

    if (count !== 1) return null;

    const desired = ((await redis.get(keys.presence(userId))) as PresenceStatus | null) ?? "ONLINE";
    await presenceService.set(userId, desired);
    return desired;
  },

  async onDisconnect(userId: string) {
    const count = await redis.decr(keys.sessions(userId));
    if (count > 0) return null;

    await redis.del(keys.sessions(userId));
    await presenceService.set(userId, "OFFLINE");
    return "OFFLINE" as const;
  },

  async set(userId: string, status: PresenceStatus) {
    if (status !== "OFFLINE") await redis.set(keys.presence(userId), status);
    await userRepository.updatePresenceCache(userId, status);
  },

  /**
   * Presença ao vivo de vários usuários de uma vez.
   *
   * Importa porque o broadcast de mudança só acontece na transição 0→1 sessões:
   * um cliente que abre uma segunda conexão (o StrictMode do React faz isso, e
   * qualquer reconexão rápida também) nunca receberia o evento e apareceria
   * offline pra si mesmo. Lendo o estado real na carga, o snapshot nasce certo.
   */
  async mapFor(userIds: string[]): Promise<Record<string, PresenceStatus>> {
    if (!userIds.length) return {};

    const pipeline = redis.pipeline();
    for (const id of userIds) {
      pipeline.exists(keys.sessions(id));
      pipeline.get(keys.presence(id));
    }

    const results = await pipeline.exec();
    const map: Record<string, PresenceStatus> = {};

    userIds.forEach((id, i) => {
      const online = Number(results?.[i * 2]?.[1] ?? 0) > 0;
      const desired = results?.[i * 2 + 1]?.[1] as PresenceStatus | null;
      map[id] = online ? (desired ?? "ONLINE") : "OFFLINE";
    });

    return map;
  },

  /** Na subida do servidor: zera presença herdada de um processo anterior. */
  async reset() {
    await userRepository.setAllOffline();
    const stale = await redis.keys("sessions:*");
    if (stale.length) await redis.del(...stale);
  },
};
