import { has } from "@gravae/shared";
import { AppError, ForbiddenError } from "~/lib/http.js";
import { redis, keys } from "~/lib/redis.js";
import { flowPassed, flowMessage, WINDOW_S as FLOW_S_WINDOW } from "~/lib/fluxo-de-mensagens.js";
import { userRepository } from "~/repositories/user-repository.js";
import type { Context } from "./access-service.js";

export function timeoutRequireNotThis(context: Context) {
  const until = context.member?.timeoutUntil;
  if (!until || until <= new Date()) return;

  const minutes = Math.ceil((until.getTime() - Date.now()) / 60_000);
  throw new ForbiddenError(`Você está de castigo neste servidor por mais ${minutes} min`).having("castigo");
}

export async function respectModeSlow(
  userId: string,
  channel: { id: string; slowmodeSeconds: number },
  context: Context,
) {
  if (!channel.slowmodeSeconds) return;

  if (
    has(context.permissions, "BYPASS_SLOWMODE") ||
    has(context.permissions, "MANAGE_MESSAGES") ||
    has(context.permissions, "MANAGE_CHANNELS")
  ) {
    return;
  }

  const key = keys.slowmode(channel.id, userId);
  const first = await redis.set(key, "1", "EX", channel.slowmodeSeconds, "NX");

  if (!first) {
    const missing = await redis.ttl(key);
    throw new AppError(`Modo lento: espere ${Math.max(missing, 1)}s para mandar de novo`, 429).having("modo-lento");
  }
}

export async function verifiedRequireEmail(
  userId: string,
  guild: { verifiedRequiresEmail: boolean | null } | null,
  context: Context,
) {
  if (context.isOwner || context.member?.roleIds?.length) return;
  if (!guild?.verifiedRequiresEmail) return;

  const user = await userRepository.findById(userId);
  if (user?.isBot || user?.emailVerifiedAt) return;

  throw new ForbiddenError(
    "Esta comunidade só deixa falar quem confirmou o e-mail. Confirme o seu nas configurações da conta.",
  ).having("recusada");
}

export async function ensureFlow(userId: string) {
  const key = keys.messagesFlow(userId);

  const rounds = await redis.multi().incr(key).expire(key, FLOW_S_WINDOW, "NX").exec();
  const uses = Number(rounds?.[0]?.[1] ?? 0);

  if (flowPassed(uses)) {
    throw new AppError(flowMessage(await redis.ttl(key)), 429).having("depressa");
  }
}
