import type { DesiredStatus, PresenceStatus } from "@gravae/shared";
import { redis, keys } from "~/lib/redis.js";
import { userRepository } from "~/repositories/user-repository.js";

const IDLE_TTL_S = 15 * 60;

const DESIRED: DesiredStatus[] = ["ONLINE", "IDLE", "DND", "INVISIBLE"];

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
    /*
      Uma ida ao Redis em vez de duas, e sem janela entre elas. Isto roda em
      toda conexão de socket — é dos caminhos mais quentes que existem aqui.
    */
    const rounds = await redis
      .multi()
      .incr(keys.sessions(userId))
      .expire(keys.sessions(userId), 60 * 60 * 24)
      .exec();

    const count = Number(rounds?.[0]?.[1] ?? 0);

    if (count !== 1) return null;

    const desired = await userRepository.desiredOf(userId);
    const projected = visible(desired, true, false);

    await presenceService.cache(userId, projected);
    return projected;
  },

  async onDisconnect(userId: string) {
    const count = await redis.decr(keys.sessions(userId));
    if (count > 0) return null;

    await redis.del(keys.sessions(userId), keys.idle(userId));
    await presenceService.cache(userId, "OFFLINE");
    return "OFFLINE" as const;
  },

  async setDesired(userId: string, desired: DesiredStatus) {
    await userRepository.setDesired(userId, desired);

    const projected = (await presenceService.mapFor([userId]))[userId] ?? "OFFLINE";
    await presenceService.cache(userId, projected);

    return projected;
  },

  async cache(userId: string, status: PresenceStatus) {
    await userRepository.updatePresenceCache(userId, status);
  },

  async desiredOf(userId: string): Promise<DesiredStatus> {
    return userRepository.desiredOf(userId);
  },

  async setIdle(userId: string, idle: boolean) {
    if (idle) await redis.set(keys.idle(userId), "1", "EX", IDLE_TTL_S);
    else await redis.del(keys.idle(userId));
  },

  /*
    A projeção junta duas fontes, e cada uma guarda o que lhe cabe.

    Do Redis vem o que é descartável e muda o tempo todo: se há aba conectada e
    se o teclado parou. Se o Redis sumir, a resposta certa para as duas é "não",
    e todo mundo aparece offline até reconectar — nada se perdeu.

    Do Mongo vem a escolha da pessoa, que não pode sumir. As duas idas acontecem
    ao mesmo tempo, então isto continua custando uma viagem de rede, não duas.
  */
  async mapFor(userIds: string[]): Promise<Record<string, PresenceStatus>> {
    if (!userIds.length) return {};

    const pipeline = redis.pipeline();
    for (const id of userIds) {
      pipeline.exists(keys.sessions(id));
      pipeline.exists(keys.idle(id));
    }

    const [results, desiredById] = await Promise.all([
      pipeline.exec(),
      userRepository.desiredMany(userIds),
    ]);

    const map: Record<string, PresenceStatus> = {};

    userIds.forEach((id, i) => {
      const online = Number(results?.[i * 2]?.[1] ?? 0) > 0;
      const idle = Number(results?.[i * 2 + 1]?.[1] ?? 0) > 0;

      map[id] = visible(desiredById[id] ?? "ONLINE", online, idle);
    });

    return map;
  },

  async reset() {
    await userRepository.setAllOffline();
    const stale = await redis.keys("sessions:*");
    const idles = await redis.keys("idle:*");
    if (stale.length || idles.length) await redis.del(...stale, ...idles);
  },
  /*
    Traz o status escolhido do Redis para o Mongo, uma vez só.

    Ele morava em `presence:<id>`. Sem esta cópia, quem estava Invisível ou em
    Não perturbe voltaria a aparecer Online no primeiro deploy — o campo novo
    nasce vazio e o Prisma o lê como ONLINE. Quem não tem nada guardado recebe
    ONLINE gravado de verdade, e por isso a segunda subida já não acha ninguém.
  */
  async migrateDesired(): Promise<number> {
    const ids = await userRepository.idsWithoutDesired();

    for (let i = 0; i < ids.length; i += 500) {
      const batch = ids.slice(i, i + 500);
      const saved = await redis.mget(batch.map((id) => keys.legacyPresence(id)));

      const byStatus = new Map<DesiredStatus, string[]>();
      batch.forEach((id, j) => {
        const value = saved[j] as DesiredStatus | null;
        const status = value && DESIRED.includes(value) ? value : "ONLINE";
        byStatus.set(status, [...(byStatus.get(status) ?? []), id]);
      });

      for (const [status, group] of byStatus) await userRepository.setDesiredMany(group, status);
      await redis.del(...batch.map((id) => keys.legacyPresence(id)));
    }

    return ids.length;
  },
};
