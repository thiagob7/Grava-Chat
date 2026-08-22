import type { DesiredStatus, PresenceStatus } from "@gravae/shared";
import { redis, keys } from "~/lib/redis.js";
import { userRepository } from "~/repositories/user-repository.js";

/**
 * O Redis é a fonte da verdade da presença; o campo no Mongo é só cache do
 * último estado conhecido. Presença é efêmera e tem que sumir sozinha se o
 * processo cair.
 */
/** Quanto tempo a marca de ausente sobrevive sem o cliente renovar. */
const IDLE_TTL_S = 15 * 60;

/**
 * O que os OUTROS veem, a partir do que a pessoa escolheu.
 *
 * Ponto unico de projecao — `mapFor`, o broadcast e o snapshot inicial passam
 * todos por aqui. Fica isolada e pura porque e a regra que decide se alguem
 * consegue se esconder: errar aqui expoe quem pediu pra nao ser visto.
 *
 * A ordem importa: "nao perturbe" vence a ausencia automatica, senao quem pediu
 * silencio apareceria como apenas ausente ao parar de mexer no mouse.
 */
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

  /**
   * Contagem por socket, não por usuário: ele pode ter 3 abas mais o app
   * desktop, e só fica offline quando a última cair.
   */
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

  /**
   * Grava a ESCOLHA da pessoa. Nunca vai pro Mongo — `INVISIBLE` nao existe no
   * enum de la, e e justamente isso que impede o invisivel de vazar.
   */
  async setDesired(userId: string, desired: DesiredStatus) {
    await redis.set(keys.presence(userId), desired);
  },

  /** Cache no Mongo do valor PROJETADO. O tipo estreito e a defesa. */
  async cache(userId: string, status: PresenceStatus) {
    await userRepository.updatePresenceCache(userId, status);
  },

  /** O que a pessoa escolheu — so ela ve isso. */
  async desiredOf(userId: string): Promise<DesiredStatus> {
    return ((await redis.get(keys.presence(userId))) as DesiredStatus | null) ?? "ONLINE";
  },

  /** Marca (ou tira) a ausencia automatica. Renovada pelo cliente. */
  async setIdle(userId: string, idle: boolean) {
    if (idle) await redis.set(keys.idle(userId), "1", "EX", IDLE_TTL_S);
    else await redis.del(keys.idle(userId));
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

  /**
   * Na subida do servidor: zera presença herdada de um processo anterior.
   *
   * Apaga `sessions:*` e `idle:*`, e NUNCA `presence:*` — quem escolheu ficar
   * invisível ou em "não perturbe" continua assim depois de um restart. Isso
   * deixou de ser detalhe: é o que impede o invisível de virar visível sozinho.
   */
  async reset() {
    await userRepository.setAllOffline();
    const stale = await redis.keys("sessions:*");
    const idles = await redis.keys("idle:*");
    if (stale.length || idles.length) await redis.del(...stale, ...idles);
  },
};
