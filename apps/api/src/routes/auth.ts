import type { FastifyInstance, FastifyRequest } from "fastify";
import oauth2, { type OAuth2Namespace } from "@fastify/oauth2";
import { env, isDev } from "~/env.js";
import { googleService } from "~/services/google-service.js";
import { authService, REFRESH_COOKIE } from "~/services/auth-service.js";
import { desktopLoginService } from "~/services/desktop-login-service.js";
import { toSelfUser } from "~/lib/serialize.js";
import { devLoginInput, desktopExchangeInput, desktopStartInput } from "~/validations/auth.js";

declare module "fastify" {
  interface FastifyInstance {
    googleOAuth2: OAuth2Namespace;
  }
}

const refreshCookieOptions = {
  httpOnly: true,
  path: "/api/auth",
  sameSite: "lax" as const,
  secure: env.NODE_ENV === "production",
  maxAge: 30 * 24 * 60 * 60,
};

const DESKTOP_COOKIE = "gravae_desktop";

const desktopCookieOptions = {
  httpOnly: true,
  path: "/api/auth",
  sameSite: "lax" as const,
  secure: env.NODE_ENV === "production",
  maxAge: 10 * 60,
};

function paginaDeVolta(destino: string | null) {
  const corpo = destino
    ? `<h1>Tudo certo!</h1>
       <p>Pode voltar pro Gravaê — a janela do aplicativo já está te esperando.</p>
       <p><a href="${destino}">Abrir o Gravaê</a></p>
       <script>location.href = ${JSON.stringify(destino)}</script>`
    : `<h1>O login falhou</h1>
       <p>Volte pro aplicativo e tente de novo.</p>`;

  return `<!doctype html><html lang="pt-BR"><meta charset="utf-8">
    <title>Gravaê</title>
    <body style="background:#2b2d31;color:#f2f3f5;font:15px/1.6 -apple-system,Segoe UI,sans-serif;display:grid;place-items:center;height:100vh;margin:0;text-align:center">
      <div>${corpo}</div>
    </body></html>`;
}

function origemDoTunel(req: FastifyRequest): string | null {
  // Só em desenvolvimento. Em produção existe um proxy reverso na frente
  // (Caddy) que SEMPRE preenche x-forwarded-host — e aí o app passaria a se
  // achar num túnel, mandando o usuário de volta pro domínio da API em vez do
  // front. Túnel de ngrok, que é o motivo desta função existir, só acontece em dev.
  if (!isDev) return null;

  const forwardedHost = req.headers["x-forwarded-host"];
  if (typeof forwardedHost !== "string" || !forwardedHost) return null;

  return `${req.protocol}://${forwardedHost}`;
}

function callbackUrl(req: FastifyRequest) {
  return `${origemDoTunel(req) ?? env.API_PUBLIC_URL}/api/auth/google/callback`;
}

function webAppUrl(req: FastifyRequest, path = "/") {
  const base = origemDoTunel(req) ?? env.WEB_ORIGIN.split(",")[0]?.trim() ?? "";
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
      cookie: { path: "/api/auth", sameSite: "lax", secure: env.NODE_ENV === "production" },
    });

    app.get("/auth/desktop/start", async (req, reply) => {
      const { desafio } = desktopStartInput.parse(req.query);

      return reply
        .setCookie(DESKTOP_COOKIE, desafio, desktopCookieOptions)
        .redirect("/api/auth/google");
    });

    app.get("/auth/google/callback", async (req, reply) => {
      const desafio = req.cookies[DESKTOP_COOKIE];

      try {
        const { token } = await app.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);
        const profile = await googleService.fetchProfile(token.access_token);

        const user = await authService.signInWithProvider({ provider: "google", ...profile });

        if (desafio) {
          const codigo = await desktopLoginService.emitirCodigo(user.id, desafio);

          return reply
            .clearCookie(DESKTOP_COOKIE, desktopCookieOptions)
            .type("text/html")
            .send(paginaDeVolta(`gravae://auth?codigo=${encodeURIComponent(codigo)}`));
        }

        const refresh = await authService.issueRefreshToken(user.id, metaOf(req));

        return reply
          .setCookie(REFRESH_COOKIE, refresh.raw, refreshCookieOptions)
          .redirect(webAppUrl(req, "/channels"));
      } catch (error) {
        req.log.error({ err: error }, "falha no login com Google");

        if (desafio) {
          return reply
            .clearCookie(DESKTOP_COOKIE, desktopCookieOptions)
            .type("text/html")
            .send(paginaDeVolta(null));
        }

        return reply.redirect(webAppUrl(req, "/login?erro=google"));
      }
    });

    app.post("/auth/desktop/trocar", async (req, reply) => {
      const { codigo, verificador } = desktopExchangeInput.parse(req.body);

      const userId = await desktopLoginService.resgatar(codigo, verificador);
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
    voiceUrl: env.LIVEKIT_URL,
  }));
}
