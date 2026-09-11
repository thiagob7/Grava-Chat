import { createHash, randomBytes } from "node:crypto";

import { env } from "~/env.js";
import { officialService } from "~/services/oficial-service.js";
import { mail } from "~/lib/correio.js";
import { AppError } from "~/lib/http.js";
import { keys, redis } from "~/lib/redis.js";
import { userRepository } from "~/repositories/user-repository.js";

const VALIDITY_S = 24 * 60 * 60;

const WAIT_S = 60;

const digest = (token: string) => createHash("sha256").update(token).digest("base64url");

const web = () => env.WEB_ORIGIN.split(",")[0]?.trim() ?? "";

export const VERIFICATION_PATH = "/verificar-email";

export function emailText(name: string, link: string) {
  return [
    `Oi, ${name}.`,
    "",
    "Confirme o seu e-mail para poder falar nas comunidades que exigem isso. O link abaixo resolve:",
    "",
    link,
    "",
    "Ele vale por um dia e só serve uma vez. Se não foi você quem criou a conta, é só ignorar.",
  ].join("\n");
}

export const verificationService = {
  async askFor(userId: string) {
    if (!mail.on()) {
      throw new AppError("O envio de e-mail não está configurado neste servidor", 503);
    }

    const user = await userRepository.findById(userId);
    if (!user || user.isBot || user.system) throw new AppError("Conta inválida", 400);
    if (user.emailVerifiedAt) throw new AppError("Este e-mail já está confirmado", 400);

    const first = await redis.set(
      keys.verificationRequest(user.id),
      "1",
      "EX",
      WAIT_S,
      "NX",
    );
    if (!first) throw new AppError("Espere um minuto antes de pedir de novo", 429);

    const token = randomBytes(32).toString("base64url");

    await redis.set(keys.emailVerification(digest(token)), user.id, "EX", VALIDITY_S);

    await mail.send(
      user.email,
      "Confirme o seu e-mail no Gravaê",
      emailText(user.displayName, `${web()}${VERIFICATION_PATH}?token=${token}`),
    );
  },

  async confirm(token: string) {
    const userId = await redis.getdel(keys.emailVerification(digest(token)));
    if (!userId) throw new AppError("Este link já foi usado ou passou da validade", 400);

    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("Este link já foi usado ou passou da validade", 400);

    if (!user.emailVerifiedAt) {
      await userRepository.update(user.id, { emailVerifiedAt: new Date() });
      void officialService.notify(user.id, "emailConfirmed", undefined);
    }

    await redis.del(keys.verificationRequest(user.id));
  },
};
