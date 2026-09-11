import { createHash, randomBytes } from "node:crypto";

import { UnauthorizedError } from "~/lib/http.js";
import { keys, redis } from "~/lib/redis.js";

const VALIDITY_SECONDS = 120;

const hash = (value: string) => createHash("sha256").update(value).digest("base64url");

export const desktopLoginService = {
  newChallenge: () => randomBytes(32).toString("base64url"),

  async emitCode(userId: string, challenge: string) {
    const code = randomBytes(32).toString("base64url");

    await redis.set(
      keys.desktopLogin(code),
      JSON.stringify({ userId, challenge }),
      "EX",
      VALIDITY_SECONDS,
    );

    return code;
  },

  async redeem(code: string, verifier: string): Promise<string> {
    const raw = await redis.getdel(keys.desktopLogin(code));
    if (!raw) throw new UnauthorizedError("Código de login expirado ou já usado");

    const { userId, challenge } = JSON.parse(raw) as { userId: string; challenge: string };
    if (hash(verifier) !== challenge) throw new UnauthorizedError("Código de login inválido");

    return userId;
  },
};
