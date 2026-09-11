import { beforeEach, describe, expect, it, vi } from "vitest";

const env = { WEB_ORIGIN: "https://gravae-chat.vercel.app", ACCEPT_PREVIEWS_VERCEL: false };

vi.mock("~/env.js", () => ({ env, isDev: false }));

const { originAllowed } = await import("~/lib/origins.js");

beforeEach(() => {
  env.ACCEPT_PREVIEWS_VERCEL = false;
});

describe("origens aceitas", () => {
  it("aceita a que está configurada", () => {
    expect(originAllowed("https://gravae-chat.vercel.app")).toBe(true);
  });

  it("recusa uma qualquer", () => {
    expect(originAllowed("https://site-de-outro.com")).toBe(false);
  });

  it("pedido sem origem passa — é o curl e o app de desktop", () => {
    expect(originAllowed(undefined)).toBe(true);
  });
});

describe("prévias da Vercel", () => {
  it("desligado, a prévia é recusada como qualquer outra", () => {
    expect(originAllowed("https://gravae-chat-abc123-thiago.vercel.app")).toBe(false);
  });

  it("ligado, qualquer prévia da Vercel entra", () => {
    env.ACCEPT_PREVIEWS_VERCEL = true;

    for (const o of [
      "https://gravae-chat-abc123-thiago.vercel.app",
      "https://gravae-chat-git-staging-thiago.vercel.app",
    ]) {
      expect({ o, ok: originAllowed(o) }).toEqual({ o, ok: true });
    }
  });

  it("ligado, ainda exige https e o domínio exato", () => {
    env.ACCEPT_PREVIEWS_VERCEL = true;

    for (const o of [
      "http://gravae-chat.vercel.app",
      "https://vercel.app.site-de-outro.com",
      "https://naovercel.app.br",
    ]) {
      expect({ o, ok: originAllowed(o) }).toEqual({ o, ok: false });
    }
  });
});
