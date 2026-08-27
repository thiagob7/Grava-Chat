import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import sensible from "@fastify/sensible";
import { ZodError } from "zod";
import { env, isDev } from "~/env.js";
import { authPlugin } from "~/plugins/auth.js";
import { AppError } from "~/lib/http.js";
import { corsOrigin } from "~/lib/origins.js";
import { healthRoutes } from "~/routes/health.js";
import { statusRoutes } from "~/routes/status.js";
import { authRoutes } from "~/routes/auth.js";
import { meRoutes } from "~/routes/me.js";
import { guildRoutes } from "~/routes/guilds.js";
import { roleRoutes } from "~/routes/roles.js";
import { webhookRoutes, publicWebhookRoutes } from "~/routes/webhooks.js";
import { expressionRoutes } from "~/routes/expressions.js";
import { moderationRoutes } from "~/routes/moderation.js";
import { forumRoutes } from "~/routes/forum.js";
import { gifRoutes } from "~/routes/gifs.js";
import { inviteRoutes } from "~/routes/invites.js";
import { messageRoutes } from "~/routes/messages.js";
import { uploadRoutes } from "~/routes/uploads.js";
import { voiceRoutes } from "~/routes/voice.js";
import { friendRoutes } from "~/routes/friends.js";
import { userRoutes } from "~/routes/users.js";
import { botRoutes } from "~/routes/bots.js";
import { oauthRoutes } from "~/routes/oauth.js";
import { botApiRoutes } from "~/routes/bot-api.js";
import { embedRoutes } from "~/routes/embeds.js";

export async function buildApp() {
  const app = Fastify({
    logger: isDev
      ? { transport: { target: "pino-pretty", options: { translateTime: "HH:MM:ss", ignore: "pid,hostname" } } }
      : true,
    trustProxy: true, // atras do Caddy/Cloudflare em producao
  });

  await app.register(sensible);

  await app.register(cors, {
    origin: (origin, cb) => corsOrigin(origin, cb),
    credentials: true,
  });

  await app.register(cookie, { secret: env.COOKIE_SECRET });
  await app.register(authPlugin);

  app.setErrorHandler((error, req, reply) => {
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({ message: error.message });
    }

    if (error instanceof ZodError) {
      return reply.code(400).send({
        message: error.issues[0]?.message ?? "Dados inválidos",
        issues: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      });
    }

    const status = (error as { statusCode?: number }).statusCode;
    if (status && status < 500) {
      return reply.code(status).send({ message: (error as Error).message });
    }

    req.log.error(error as Error);
    return reply.code(500).send({ message: "Erro interno" });
  });

  await app.register(
    async (api) => {
      await api.register(healthRoutes);
      await api.register(statusRoutes);
      await api.register(authRoutes);
      await api.register(meRoutes);
      await api.register(guildRoutes);
      await api.register(botRoutes);
      await api.register(oauthRoutes);
      await api.register(botApiRoutes);
      await api.register(roleRoutes);
      await api.register(inviteRoutes);
      await api.register(messageRoutes);
      await api.register(uploadRoutes);
      await api.register(voiceRoutes);
      await api.register(friendRoutes);
      await api.register(userRoutes);
      await api.register(webhookRoutes);
      await api.register(expressionRoutes);
      await api.register(moderationRoutes);
      await api.register(forumRoutes);
      await api.register(gifRoutes);
      await api.register(embedRoutes);
      await api.register(publicWebhookRoutes);
    },
    { prefix: "/api" },
  );

  return app;
}

export type App = Awaited<ReturnType<typeof buildApp>>;
