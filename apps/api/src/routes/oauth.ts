import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";

import { UnauthorizedError } from "~/lib/http.js";
import { oauthService } from "~/services/oauth-service.js";
import { objectId } from "~/validations/common.js";

const pedido = z.object({
  client_id: objectId,
  redirect_uri: z.string().url(),
  /// separados por espaço, como manda o OAuth2
  scope: z.string().min(1).max(200),
});

const troca = z.object({
  code: z.string().min(1).max(200),
  client_id: objectId,
  client_secret: z.string().min(1).max(200),
  redirect_uri: z.string().url(),
});

/// O token do dev vem no cabeçalho, como em qualquer API: "Bearer <token>".
async function sessaoDaAplicacao(req: FastifyRequest) {
  const cabecalho = req.headers.authorization;
  if (!cabecalho?.startsWith("Bearer ")) throw new UnauthorizedError("Falta o token da aplicação");

  return oauthService.resolverToken(cabecalho.slice(7).trim());
}

/**
 * O OAuth2 das aplicações.
 *
 * É o que permite alguém montar um painel PRÓPRIO, fora daqui, e ainda assim
 * saber quem entrou e em quais servidores essa pessoa manda — sem nunca ver a
 * senha nem o cookie de sessão de ninguém.
 */
export async function oauthRoutes(app: FastifyInstance) {
  /// Só descreve o pedido; quem decide é a tela do app, que exige login.
  app.get("/oauth2/pedido", { preHandler: [app.authenticate] }, (req) => {
    const { client_id, redirect_uri, scope } = pedido.parse(req.query);

    return oauthService.descreverPedido({
      botId: client_id,
      redirectUri: redirect_uri,
      escopos: scope.split(/[\s+]+/).filter(Boolean),
    });
  });

  app.post("/oauth2/autorizar", { preHandler: [app.authenticate] }, (req) => {
    const { client_id, redirect_uri, scope } = pedido.parse(req.body);

    return oauthService.emitirCodigo(req.userId, {
      botId: client_id,
      redirectUri: redirect_uri,
      escopos: scope.split(/[\s+]+/).filter(Boolean),
    });
  });

  /*
    A troca roda no servidor do dev, com o segredo da aplicação — por isso não
    tem `authenticate`: quem chama aqui é uma máquina, não um navegador com
    cookie.
  */
  app.post("/oauth2/token", (req) => {
    const dados = troca.parse(req.body);

    return oauthService.trocarCodigo({
      codigo: dados.code,
      clientId: dados.client_id,
      clientSecret: dados.client_secret,
      redirectUri: dados.redirect_uri,
    });
  });

  app.get("/oauth2/usuario", async (req) => oauthService.quemEh(await sessaoDaAplicacao(req)));

  app.get("/oauth2/servidores", async (req) =>
    oauthService.servidoresDe(await sessaoDaAplicacao(req)),
  );
}
