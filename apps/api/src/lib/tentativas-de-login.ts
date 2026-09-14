import { createHash } from "node:crypto";

import { AppError } from "~/lib/http.js";
import { redis, keys } from "~/lib/redis.js";

const FAILURES_MAX = 10;
const WINDOW_S = 15 * 60;

const keyOf = (email: string) =>
  keys.loginFailures(createHash("sha256").update(email.trim().toLowerCase()).digest("hex"));

export const loginAttempts = {
  async require(email: string) {
    const failures = Number(await redis.get(keyOf(email)).catch(() => 0));
    if (failures < FAILURES_MAX) return;

    const ttl = await redis.ttl(keyOf(email)).catch(() => WINDOW_S);
    throw new AppError(
      `Muitas tentativas erradas nesta conta. Tente de novo em ${Math.ceil(Math.max(ttl, 60) / 60)} min.`,
      429,
    );
  },

  async fail(email: string) {
    await redis.multi().incr(keyOf(email)).expire(keyOf(email), WINDOW_S, "NX").exec().catch(() => undefined);
  },

  async clear(email: string) {
    await redis.del(keyOf(email)).catch(() => undefined);
  },
};
