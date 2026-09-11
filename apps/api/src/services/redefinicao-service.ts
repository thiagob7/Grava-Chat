import { createHash, randomBytes } from "node:crypto";

import { env } from "~/env.js";
import { officialService } from "~/services/oficial-service.js";
import { mail } from "~/lib/correio.js";
import { AppError } from "~/lib/http.js";
import { generateHash } from "~/lib/senha.js";
import { keys, redis } from "~/lib/redis.js";
import { accountRepository } from "~/repositories/account-repository.js";
import { sessionRepository } from "~/repositories/session-repository.js";
import { userRepository } from "~/repositories/user-repository.js";

const VALIDITY_S = 30 * 60;

const WAIT_S = 60;

const digest = (token: string) => createHash("sha256").update(token).digest("base64url");

const web = () => env.WEB_ORIGIN.split(",")[0]?.trim() ?? "";

export const RESET_PATH = "/redefinir";

export function emailText(name: string, link: string) {
  return [
    `Oi, ${name}.`,
    "",
    "Alguém pediu uma senha nova para a sua conta do Gravaê. Se foi você, o link abaixo abre a tela de escolher:",
    "",
    link,
    "",
    "Ele vale por 30 minutos e só serve uma vez. Se não foi você, não precisa fazer nada — a senha de agora continua valendo.",
  ].join("\n");
}

export const resetService = {
  async askFor(email: string) {
    if (!mail.on()) {
      throw new AppError("O envio de e-mail não está configurado neste servidor", 503);
    }

    const user = await userRepository.findByEmail(email.trim().toLowerCase());
    if (!user || user.isBot || user.system) return;

    const first = await redis.set(keys.resetRequest(user.id), "1", "EX", WAIT_S, "NX");
    if (!first) return;

    const token = randomBytes(32).toString("base64url");

    await redis.set(keys.passwordReset(digest(token)), user.id, "EX", VALIDITY_S);

    const link = `${web()}${RESET_PATH}?token=${token}`;

    await mail.send(
      user.email,
      "Sua senha nova do Gravaê",
      emailText(user.displayName, link),
    );
  },

  async reset(token: string, fresh: string) {
    const userId = await redis.getdel(keys.passwordReset(digest(token)));
    if (!userId) throw new AppError("Este link já foi usado ou passou da validade", 400);

    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("Este link já foi usado ou passou da validade", 400);

    await userRepository.update(user.id, { passwordHash: await generateHash(fresh) });

    const accounts = await accountRepository.findManyByUser(user.id);
    if (!accounts.some((c) => c.provider === "senha")) {
      await accountRepository.create({
        userId: user.id,
        provider: "senha",
        providerAccountId: user.email,
      });
    }

    await sessionRepository.revokeAllForUser(user.id);
    await redis.del(keys.resetRequest(user.id));

    void officialService.notify(user.id, "passwordSwapped", undefined);
  },
};
