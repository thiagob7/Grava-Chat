import { rooms } from "@gravae/shared";

import { redis, keys } from "~/lib/redis.js";
import { io } from "~/realtime/io.js";

const ACCESS_TTL_S = 15 * 60;

export async function revokeAccess(userId: string) {
  const now = Math.floor(Date.now() / 1000);

  await redis.set(keys.accessValidAfter(userId), now, "EX", ACCESS_TTL_S + 60).catch(() => undefined);

  try {
    io().in(rooms.user(userId)).disconnectSockets(true);
  } catch {
    return;
  }
}

export async function accessRevoked(userId: string, issuedAt: number | undefined) {
  const validAfter = await redis.get(keys.accessValidAfter(userId)).catch(() => null);
  if (!validAfter) return false;

  return !issuedAt || issuedAt < Number(validAfter);
}
