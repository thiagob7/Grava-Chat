import { createHash, randomBytes } from "node:crypto";

import { UnauthorizedError } from "~/lib/http.js";
import { keys, redis } from "~/lib/redis.js";

const VALIDADE_SEGUNDOS = 120;

const hash = (valor: string) => createHash("sha256").update(valor).digest("base64url");

export const desktopLoginService = {
  novoDesafio: () => randomBytes(32).toString("base64url"),

  async emitirCodigo(userId: string, desafio: string) {
    const codigo = randomBytes(32).toString("base64url");

    await redis.set(
      keys.desktopLogin(codigo),
      JSON.stringify({ userId, desafio }),
      "EX",
      VALIDADE_SEGUNDOS,
    );

    return codigo;
  },

  async resgatar(codigo: string, verificador: string): Promise<string> {
    const bruto = await redis.getdel(keys.desktopLogin(codigo));
    if (!bruto) throw new UnauthorizedError("Código de login expirado ou já usado");

    const { userId, desafio } = JSON.parse(bruto) as { userId: string; desafio: string };
    if (hash(verificador) !== desafio) throw new UnauthorizedError("Código de login inválido");

    return userId;
  },
};
