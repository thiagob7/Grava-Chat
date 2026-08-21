import { createHash, randomBytes } from "node:crypto";

import { UnauthorizedError } from "~/lib/http.js";
import { keys, redis } from "~/lib/redis.js";

/**
 * Login do aplicativo de desktop.
 *
 * O Google recusa a tela de consentimento dentro de um navegador embutido — e
 * está certo: numa janela do próprio app não dá pra saber que a senha está indo
 * mesmo pro Google. Então o consentimento acontece no navegador do sistema, e o
 * resultado volta pro app por `gravae://auth?codigo=...`.
 *
 * O código sozinho não basta. Qualquer programa da máquina pode se registrar
 * no mesmo `gravae://` e interceptar o retorno; por isso o app sorteia um
 * *verificador*, manda só o sha256 dele quando abre o navegador, e na troca
 * precisa apresentar o original. Quem interceptou o código não tem o
 * verificador, e o código sem ele não vira sessão. É o mesmo PKCE do OAuth
 * para aplicativos nativos.
 */

/** O código vive o tempo de sair do navegador e chegar no app. */
const VALIDADE_SEGUNDOS = 120;

const hash = (valor: string) => createHash("sha256").update(valor).digest("base64url");

export const desktopLoginService = {
  /** Sorteado pelo app; guardado no navegador entre o "start" e o callback. */
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

  /**
   * Devolve de quem é o código — uma vez só. O `getdel` é o que garante isso:
   * dois pedidos com o mesmo código, e só o primeiro encontra algo.
   */
  async resgatar(codigo: string, verificador: string): Promise<string> {
    const bruto = await redis.getdel(keys.desktopLogin(codigo));
    if (!bruto) throw new UnauthorizedError("Código de login expirado ou já usado");

    const { userId, desafio } = JSON.parse(bruto) as { userId: string; desafio: string };
    if (hash(verificador) !== desafio) throw new UnauthorizedError("Código de login inválido");

    return userId;
  },
};
