import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";

import { UnauthorizedError } from "~/lib/http.js";
import { oauthService } from "~/services/oauth-service.js";
import { objectId } from "~/validations/common.js";

const request = z.object({
  client_id: objectId,
  redirect_uri: z.string().url(),
  scope: z.string().min(1).max(200),
});

const authorization = request.extend({
  guild_id: objectId.optional(),
  permissions: z.array(z.string().max(64)).max(64).optional(),
});

const swap = z.object({
  code: z.string().min(1).max(200),
  client_id: objectId,
  client_secret: z.string().min(1).max(200),
  redirect_uri: z.string().url(),
});

async function applicationSession(req: FastifyRequest) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw new UnauthorizedError("Falta o token da aplicação");

  return oauthService.resolveToken(header.slice(7).trim());
}

export async function oauthRoutes(app: FastifyInstance) {
  app.get("/oauth2/pedido", { preHandler: [app.authenticate] }, (req) => {
    const { client_id, redirect_uri, scope } = request.parse(req.query);

    return oauthService.describeRequest({
      botId: client_id,
      redirectUri: redirect_uri,
      scopes: scope.split(/[\s+]+/).filter(Boolean),
    });
  });

  app.post("/oauth2/autorizar", { preHandler: [app.authenticate] }, (req) => {
    const { client_id, redirect_uri, scope, guild_id, permissions } = authorization.parse(req.body);

    return oauthService.emitCode(req.userId, {
      botId: client_id,
      redirectUri: redirect_uri,
      scopes: scope.split(/[\s+]+/).filter(Boolean),
      guildId: guild_id,
      permissions: permissions,
    });
  });

  app.post("/oauth2/token", (req) => {
    const data = swap.parse(req.body);

    return oauthService.swapCode({
      code: data.code,
      clientId: data.client_id,
      clientSecret: data.client_secret,
      redirectUri: data.redirect_uri,
    });
  });

  app.get("/oauth2/usuario", async (req) => oauthService.whoIs(await applicationSession(req)));

  app.get("/oauth2/servidores", async (req) =>
    oauthService.servers(await applicationSession(req)),
  );
}
