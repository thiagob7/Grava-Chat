import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import oauth2, { type OAuth2Namespace } from "@fastify/oauth2";
import { z } from "zod";
import { env, isDev } from "~/env.js";
import { googleService } from "~/services/google-service.js";
import { authService, REFRESH_COOKIE } from "~/services/auth-service.js";
import { desktopLoginService } from "~/services/desktop-login-service.js";
import { resetService } from "~/services/redefinicao-service.js";
import { verificationService } from "~/services/verificacao-service.js";
import { mail } from "~/lib/correio.js";
import { toSelfUser } from "~/lib/serialize.js";
import {
  devLoginInput,
  desktopExchangeInput,
  desktopStartInput,
  joinInput,
  forgotInput,
  resetInput,
  registerInput,
  swapPasswordInput,
} from "~/validations/auth.js";

declare module "fastify" {
  interface FastifyInstance {
    googleOAuth2: OAuth2Namespace;
  }
}

const betweenSites = env.COOKIE_BETWEEN_SITES;
const cookiePolicy = {
  httpOnly: true,
  path: "/api/auth",
  sameSite: (betweenSites ? "none" : "lax") as "none" | "lax",
  secure: betweenSites || env.NODE_ENV === "production",
};

const refreshCookieOptions = {
  ...cookiePolicy,
  maxAge: 30 * 24 * 60 * 60,
};

const DESKTOP_COOKIE = "gravae_desktop";

const desktopCookieOptions = {
  ...cookiePolicy,
  maxAge: 10 * 60,
};

function backPage(destination: string | null) {
  const body = destination
    ? `<h1>Tudo certo!</h1>
       <p>Pode voltar pro Gravaê — a janela do aplicativo já está te esperando.</p>
       <p><a href="${destination}">Abrir o Gravaê</a></p>
       <script>location.href = ${JSON.stringify(destination)}</script>`
    : `<h1>O login falhou</h1>
       <p>Volte pro aplicativo e tente de novo.</p>`;

  return `<!doctype html><html lang="pt-BR"><meta charset="utf-8">
    <title>Gravaê</title>
    <body style="background:#2b2d31;color:#f2f3f5;font:15px/1.6 -apple-system,Segoe UI,sans-serif;display:grid;place-items:center;height:100vh;margin:0;text-align:center">
      <div>${body}</div>
    </body></html>`;
}

function tunnelOrigin(req: FastifyRequest): string | null {
  if (!isDev) return null;

  const forwardedHost = req.headers["x-forwarded-host"];
  if (typeof forwardedHost !== "string" || !forwardedHost) return null;

  return `${req.protocol}://${forwardedHost}`;
}

function callbackUrl(req: FastifyRequest) {
  return `${tunnelOrigin(req) ?? env.API_PUBLIC_URL}/api/auth/google/callback`;
}

function webAppUrl(req: FastifyRequest, path = "/") {
  const base = tunnelOrigin(req) ?? env.WEB_ORIGIN.split(",")[0]?.trim() ?? "";
  return `${base}${path}`;
}

export async function authRoutes(app: FastifyInstance) {
  const metaOf = (req: { headers: Record<string, unknown>; ip: string }) => ({
    userAgent: typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : undefined,
    ip: req.ip,
  });

  if (isDev) {
    app.post("/auth/dev-login", async (req, reply) => {
      const body = devLoginInput.parse(req.body);
      const user = await authService.findOrCreateUser(body);
      const refresh = await authService.issueRefreshToken(user.id, metaOf(req));

      return reply
        .setCookie(REFRESH_COOKIE, refresh.raw, refreshCookieOptions)
        .send({ accessToken: app.jwt.sign({ sub: user.id }), user: toSelfUser(user, await authService.providersOf(user.id)) });
    });
  }

  const openSession = async (req: FastifyRequest, reply: FastifyReply, user: { id: string }) => {
    const complete = await authService.requireUser(user.id);
    const refresh = await authService.issueRefreshToken(complete.id, metaOf(req));

    return reply
      .setCookie(REFRESH_COOKIE, refresh.raw, refreshCookieOptions)
      .send({
        accessToken: app.jwt.sign({ sub: complete.id }),
        user: toSelfUser(complete, await authService.providersOf(complete.id)),
      });
  };

  app.post("/auth/registrar", { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } }, async (req, reply) => {
    const user = await authService.register(registerInput.parse(req.body));
    return openSession(req, reply, user);
  });

  app.post("/auth/entrar", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (req, reply) => {
    const user = await authService.joinWithPassword(joinInput.parse(req.body));
    return openSession(req, reply, user);
  });

  app.post(
    "/auth/esqueci",
    { config: { rateLimit: { max: 5, timeWindow: "15 minutes" } } },
    async (req, reply) => {
      await resetService.askFor(forgotInput.parse(req.body).email);

      return reply.code(204).send();
    },
  );

  app.post(
    "/auth/redefinir",
    { config: { rateLimit: { max: 10, timeWindow: "15 minutes" } } },
    async (req, reply) => {
      const { token, password } = resetInput.parse(req.body);
      await resetService.reset(token, password);

      return reply.code(204).send();
    },
  );

  app.post(
    "/auth/verificar-email",
    { preHandler: [app.authenticate], config: { rateLimit: { max: 5, timeWindow: "15 minutes" } } },
    async (req, reply) => {
      await verificationService.askFor(req.userId);

      return reply.code(204).send();
    },
  );

  app.post(
    "/auth/verificar-email/confirmar",
    { config: { rateLimit: { max: 10, timeWindow: "15 minutes" } } },
    async (req, reply) => {
      await verificationService.confirm(z.object({ token: z.string().min(10) }).parse(req.body).token);

      return reply.code(204).send();
    },
  );

  app.put("/auth/senha", { preHandler: [app.authenticate] }, async (req, reply) => {
    await authService.swapPassword(req.userId, swapPasswordInput.parse(req.body));
    return reply.code(204).send();
  });

  app.post("/auth/refresh", async (req, reply) => {
    const raw = req.cookies[REFRESH_COOKIE];
    if (!raw) return reply.unauthorized("Sem sessão");

    const result = await authService.rotateRefreshToken(raw, metaOf(req));
    if (!result) {
      return reply.clearCookie(REFRESH_COOKIE, refreshCookieOptions).unauthorized("Sessão expirada");
    }

    const user = await authService.requireUser(result.userId);

    return reply
      .setCookie(REFRESH_COOKIE, result.raw, refreshCookieOptions)
      .send({
        accessToken: app.jwt.sign({ sub: user.id }),
        user: toSelfUser(user, await authService.providersOf(user.id)),
      });
  });

  app.post("/auth/logout", async (req, reply) => {
    const raw = req.cookies[REFRESH_COOKIE];
    if (raw) await authService.revoke(raw);
    return reply.clearCookie(REFRESH_COOKIE, refreshCookieOptions).code(204).send();
  });

  app.post("/auth/logout-all", { preHandler: [app.authenticate] }, async (req, reply) => {
    await authService.revokeAll(req.userId);
    return reply.clearCookie(REFRESH_COOKIE, refreshCookieOptions).code(204).send();
  });

  const googleConfigured = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

  if (googleConfigured) {
    await app.register(oauth2, {
      name: "googleOAuth2",
      scope: ["openid", "email", "profile"],
      credentials: {
        client: { id: env.GOOGLE_CLIENT_ID, secret: env.GOOGLE_CLIENT_SECRET },
        auth: oauth2.GOOGLE_CONFIGURATION,
      },
      startRedirectPath: "/auth/google",
      callbackUri: callbackUrl,
      /*
        O nome engana: `callbackUriParams` entra na URL de AUTORIZAÇÃO, não na
        de retorno. `select_account` obriga o Google a mostrar o seletor. Sem
        ele, quem já tem uma sessão no navegador entra direto nela e não tem
        como escolher outra.
      */
      callbackUriParams: { prompt: "select_account" },
      cookie: cookiePolicy,
    });

    app.get("/auth/desktop/start", async (req, reply) => {
      const { challenge } = desktopStartInput.parse(req.query);

      return reply
        .setCookie(DESKTOP_COOKIE, challenge, desktopCookieOptions)
        .redirect("/api/auth/google");
    });

    app.get("/auth/google/callback", async (req, reply) => {
      const challenge = req.cookies[DESKTOP_COOKIE];

      try {
        const { token } = await app.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);
        const profile = await googleService.fetchProfile(token.access_token);

        const user = await authService.signInWithProvider({ provider: "google", ...profile });

        if (challenge) {
          const code = await desktopLoginService.emitCode(user.id, challenge);

          return reply
            .clearCookie(DESKTOP_COOKIE, desktopCookieOptions)
            .type("text/html")
            .send(backPage(`gravae://auth?codigo=${encodeURIComponent(code)}`));
        }

        const refresh = await authService.issueRefreshToken(user.id, metaOf(req));

        return reply
          .setCookie(REFRESH_COOKIE, refresh.raw, refreshCookieOptions)
          .redirect(webAppUrl(req, "/channels"));
      } catch (error) {
        req.log.error({ err: error }, "falha no login com Google");

        if (challenge) {
          return reply
            .clearCookie(DESKTOP_COOKIE, desktopCookieOptions)
            .type("text/html")
            .send(backPage(null));
        }

        return reply.redirect(webAppUrl(req, "/login?erro=google"));
      }
    });

    app.post("/auth/desktop/trocar", async (req, reply) => {
      const { code, verifier } = desktopExchangeInput.parse(req.body);

      const userId = await desktopLoginService.redeem(code, verifier);
      const user = await authService.requireUser(userId);
      const refresh = await authService.issueRefreshToken(user.id, metaOf(req));

      return reply
        .setCookie(REFRESH_COOKIE, refresh.raw, refreshCookieOptions)
        .send({
          accessToken: app.jwt.sign({ sub: user.id }),
          user: toSelfUser(user, await authService.providersOf(user.id)),
        });
    });
  }

  app.get("/auth/config", () => ({
    devLogin: isDev,
    google: googleConfigured,
    password: true,
    forgotPassword: mail.on(),
    voiceUrl: env.LIVEKIT_URL,
  }));
}
