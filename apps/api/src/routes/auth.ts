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
    /** Registrado condicionalmente — só existe quando há credenciais do Google. */
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

/**
 * O aplicativo de desktop pediu este login. O valor é o desafio do PKCE — não é
 * segredo (é um hash), e por isso pode viajar em cookie comum entre o "start" e
 * o retorno do Google, que acontecem no MESMO navegador do sistema.
 */
const DESKTOP_COOKIE = "gravae_desktop";

const desktopCookieOptions = {
  httpOnly: true,
  path: "/api/auth",
  sameSite: "lax" as const,
  secure: env.NODE_ENV === "production",
  maxAge: 10 * 60,
};

/**
 * A última tela que a pessoa vê no navegador antes de voltar pro aplicativo.
 *
 * Um 302 direto pra `gravae://` é bloqueado por parte dos navegadores — eles
 * não seguem redirecionamento pra esquema externo. Uma página que tenta e
 * oferece o link funciona nos dois casos.
 */
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

/** Origem pública desta requisição, quando ela veio por um proxy (ngrok, Caddy). */
function origemDoTunel(req: FastifyRequest): string | null {
  const forwardedHost = req.headers["x-forwarded-host"];
  if (typeof forwardedHost !== "string" || !forwardedHost) return null;

  return `${req.protocol}://${forwardedHost}`;
}

/**
 * Endereço do callback registrado no Google.
 *
 * Atrás do túnel, front e API compartilham a origem — é a URI do ngrok.
 * Direto em desenvolvimento, o navegador fala com a API na porta dela.
 * As duas formas correspondem exatamente às duas URIs cadastradas no console.
 */
function callbackUrl(req: FastifyRequest) {
  return `${origemDoTunel(req) ?? env.API_PUBLIC_URL}/api/auth/google/callback`;
}

/** Para onde mandar a pessoa DEPOIS do login: sempre o app, não a API. */
function webAppUrl(req: FastifyRequest, path = "/") {
  const base = origemDoTunel(req) ?? env.WEB_ORIGIN.split(",")[0]?.trim() ?? "";
  return `${base}${path}`;
}

export async function authRoutes(app: FastifyInstance) {
  const metaOf = (req: { headers: Record<string, unknown>; ip: string }) => ({
    userAgent: typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : undefined,
    ip: req.ip,
  });

  /**
   * Porta de entrada de DESENVOLVIMENTO. Existe pra construir e testar o chat
   * com vários usuários antes do OAuth do Google estar configurado. O callback
   * do Google (Fase 1) cai no MESMO fluxo de emissão abaixo.
   */
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

    // Toda resposta sai com um cookie utilizável, inclusive na corrida: o
    // navegador nunca deve terminar segurando um token já rotacionado.
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

  /** Só possível porque o refresh vive no banco — um JWT puro não dá pra revogar. */
  app.post("/auth/logout-all", { preHandler: [app.authenticate] }, async (req, reply) => {
    await authService.revokeAll(req.userId);
    return reply.clearCookie(REFRESH_COOKIE, refreshCookieOptions).code(204).send();
  });

  // ------------------------------- Google ---------------------------------

  const googleConfigured = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

  if (googleConfigured) {
    await app.register(oauth2, {
      name: "googleOAuth2",
      scope: ["openid", "email", "profile"],
      credentials: {
        client: { id: env.GOOGLE_CLIENT_ID, secret: env.GOOGLE_CLIENT_SECRET },
        auth: oauth2.GOOGLE_CONFIGURATION,
      },
      // O plugin cria esta rota: é para cá que o botão "Entrar com Google" leva.
      startRedirectPath: "/auth/google",
      callbackUri: callbackUrl,
      // guarda o state num cookie e valida no retorno (proteção contra CSRF)
      cookie: { path: "/api/auth", sameSite: "lax", secure: env.NODE_ENV === "production" },
    });

    /**
     * Entrada do aplicativo de desktop. Ele abre ISTO no navegador do sistema —
     * o Google recusa a tela de consentimento dentro de janela embutida, e com
     * razão. O desafio fica no cookie e é lido lá no callback.
     */
    app.get("/auth/desktop/start", async (req, reply) => {
      const { desafio } = desktopStartInput.parse(req.query);

      return reply
        .setCookie(DESKTOP_COOKIE, desafio, desktopCookieOptions)
        .redirect("/api/auth/google");
    });

    app.get("/auth/google/callback", async (req, reply) => {
      // presente = este login começou no aplicativo, e o retorno é outro
      const desafio = req.cookies[DESKTOP_COOKIE];

      try {
        const { token } = await app.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);
        const profile = await googleService.fetchProfile(token.access_token);

        const user = await authService.signInWithProvider({ provider: "google", ...profile });

        /**
         * No fluxo do aplicativo o navegador não ganha sessão nenhuma: ele só
         * carrega um código de uso único de volta pro app, que troca por
         * sessão de dentro da janela dele. Sessão sobrando num navegador que
         * a pessoa abriu sem querer é sessão que ela não sabe que tem.
         */
        if (desafio) {
          const codigo = await desktopLoginService.emitirCodigo(user.id, desafio);

          return reply
            .clearCookie(DESKTOP_COOKIE, desktopCookieOptions)
            .type("text/html")
            .send(paginaDeVolta(`gravae://auth?codigo=${encodeURIComponent(codigo)}`));
        }

        const refresh = await authService.issueRefreshToken(user.id, metaOf(req));

        /**
         * O access token NÃO vai na URL: só o cookie de refresh é gravado, e o
         * front pega o access no bootstrap com POST /auth/refresh. Token em
         * query string vaza pro histórico, pro Referer e pros logs do servidor.
         */
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

    /**
     * O aplicativo troca o código pela sessão de verdade. É esta chamada que
     * grava o cookie httpOnly — na sessão da janela do Electron, exatamente
     * como o navegador faria.
     */
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
    /**
     * O front compara com a própria origem para saber se consegue alcançar o
     * SFU. Não é segredo — é o mesmo endereço que já vai no token de voz.
     */
    voiceUrl: env.LIVEKIT_URL,
  }));
}
