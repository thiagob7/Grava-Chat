import { createHash, randomBytes } from "node:crypto";

import { env } from "~/env.js";
import { correio } from "~/lib/correio.js";
import { AppError } from "~/lib/http.js";
import { gerarHash } from "~/lib/senha.js";
import { keys, redis } from "~/lib/redis.js";
import { accountRepository } from "~/repositories/account-repository.js";
import { sessionRepository } from "~/repositories/session-repository.js";
import { userRepository } from "~/repositories/user-repository.js";

/// Meia hora: tempo de sair do app, abrir o e-mail e voltar, e curto o
/// bastante para um link esquecido na caixa não valer no dia seguinte.
const VALIDADE_S = 30 * 60;

/// Um pedido por conta por minuto. O limite da rota conta por IP; este conta
/// por caixa de entrada, que é quem sofre o incômodo.
const ESPERA_S = 60;

const digerir = (token: string) => createHash("sha256").update(token).digest("base64url");

const web = () => env.WEB_ORIGIN.split(",")[0]?.trim() ?? "";

export const CAMINHO_DA_REDEFINICAO = "/redefinir";

export function textoDoEmail(nome: string, link: string) {
  return [
    `Oi, ${nome}.`,
    "",
    "Alguém pediu uma senha nova para a sua conta do Gravaê. Se foi você, o link abaixo abre a tela de escolher:",
    "",
    link,
    "",
    "Ele vale por 30 minutos e só serve uma vez. Se não foi você, não precisa fazer nada — a senha de agora continua valendo.",
  ].join("\n");
}

export const redefinicaoService = {
  /*
    Pedir uma senha nova.

    Nunca conta se o e-mail existe: conta que não existe sai igual à que
    existe, porque a diferença viraria uma lista de quem tem conta aqui. O
    que muda é só o que acontece em silêncio depois.
  */
  async pedir(email: string) {
    if (!correio.ligado()) {
      throw new AppError("O envio de e-mail não está configurado neste servidor", 503);
    }

    const usuario = await userRepository.findByEmail(email.trim().toLowerCase());
    if (!usuario || usuario.isBot || usuario.sistema) return;

    const primeiro = await redis.set(keys.pedidoDeRedefinicao(usuario.id), "1", "EX", ESPERA_S, "NX");
    if (!primeiro) return;

    const token = randomBytes(32).toString("base64url");

    /// Guarda o resumo, e não o token: quem lê o Redis não sai daí com um
    /// link pronto para a conta de outra pessoa.
    await redis.set(keys.redefinicaoDeSenha(digerir(token)), usuario.id, "EX", VALIDADE_S);

    const link = `${web()}${CAMINHO_DA_REDEFINICAO}?token=${token}`;

    await correio.enviar(
      usuario.email,
      "Sua senha nova do Gravaê",
      textoDoEmail(usuario.displayName, link),
    );
  },

  /*
    Trocar a senha com o token do e-mail.

    O token some no resgate, valha ou não a troca — um link de senha é de uso
    único por definição. E toda sessão aberta cai junto: quem redefine ou
    esqueceu a senha, ou desconfia de que alguém entrou, e nos dois casos o
    certo é derrubar o que estava aberto.
  */
  async redefinir(token: string, nova: string) {
    const userId = await redis.getdel(keys.redefinicaoDeSenha(digerir(token)));
    if (!userId) throw new AppError("Este link já foi usado ou passou da validade", 400);

    const usuario = await userRepository.findById(userId);
    if (!usuario) throw new AppError("Este link já foi usado ou passou da validade", 400);

    await userRepository.update(usuario.id, { senhaHash: await gerarHash(nova) });

    const contas = await accountRepository.findManyByUser(usuario.id);
    if (!contas.some((c) => c.provider === "senha")) {
      await accountRepository.create({
        userId: usuario.id,
        provider: "senha",
        providerAccountId: usuario.email,
      });
    }

    await sessionRepository.revokeAllForUser(usuario.id);
    await redis.del(keys.pedidoDeRedefinicao(usuario.id));
  },
};
