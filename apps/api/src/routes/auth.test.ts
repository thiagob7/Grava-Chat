import cookie from "@fastify/cookie";
import Fastify from "fastify";
import { describe, expect, it, vi } from "vitest";

const EDGE = "segredo-da-borda-com-mais-de-trinta-e-dois-caracteres";

const env = {
  NODE_ENV: "production",
  GOOGLE_CLIENT_ID: "cliente",
  GOOGLE_CLIENT_SECRET: "segredo",
  EDGE_SECRET: EDGE,
  WEB_ORIGIN: "https://app-ravox-chat.vercel.app,https://gravae-chat.vercel.app",
  API_PUBLIC_URL: "https://app-ravox-chat.vercel.app",
  COOKIE_BETWEEN_SITES: false,
  ACCEPT_PREVIEWS_VERCEL: false,
  VERCEL_PREVIEW_SCOPE: "",
};

vi.mock("~/env.js", () => ({ env, isDev: false }));
vi.mock("~/lib/tentativas-de-login.js", () => ({ loginAttempts: {} }));
vi.mock("~/services/google-service.js", () => ({ googleService: {} }));
vi.mock("~/services/auth-service.js", () => ({ authService: {}, REFRESH_COOKIE: "gravae_refresh" }));
vi.mock("~/services/desktop-login-service.js", () => ({ desktopLoginService: {} }));
vi.mock("~/services/redefinicao-service.js", () => ({ resetService: {} }));
vi.mock("~/services/verificacao-service.js", () => ({ verificationService: {} }));
vi.mock("~/lib/correio.js", () => ({ mail: {} }));
vi.mock("~/lib/serialize.js", () => ({ toSelfUser: () => ({}) }));

const { authRoutes } = await import("./auth.js");

async function build() {
  const app = Fastify();
  await app.register(cookie);
  app.decorate("authenticate", async () => {});
  await app.register(async (api) => api.register(authRoutes), { prefix: "/api" });
  return app;
}

async function redirectUri(headers: Record<string, string>) {
  const app = await build();
  const reply = await app.inject({ method: "GET", url: "/api/auth/google", headers });
  return new URL(reply.headers.location as string).searchParams.get("redirect_uri");
}

describe("volta do login com Google", () => {
  it("volta para o endereço por onde a pessoa entrou, se ele é nosso e veio pela borda", async () => {
    expect(await redirectUri({ "x-gravae-borda": EDGE, "x-forwarded-host": "gravae-chat.vercel.app" })).toBe(
      "https://gravae-chat.vercel.app/api/auth/google/callback",
    );
  });

  it("sem a borda, o cabeçalho de endereço é ignorado", async () => {
    expect(await redirectUri({ "x-forwarded-host": "gravae-chat.vercel.app" })).toBe(
      "https://app-ravox-chat.vercel.app/api/auth/google/callback",
    );
  });

  it("um endereço que não é nosso não vira destino, mesmo pela borda", async () => {
    expect(await redirectUri({ "x-gravae-borda": EDGE, "x-forwarded-host": "site-de-outro.com" })).toBe(
      "https://app-ravox-chat.vercel.app/api/auth/google/callback",
    );
  });
});
