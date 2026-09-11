import { describe, expect, it } from "vitest";
import Fastify from "fastify";
import rateLimit from "@fastify/rate-limit";

import { throughputPolicy } from "~/lib/vazao.js";

async function testServer(overwrite: Partial<typeof throughputPolicy> = {}) {
  const app = Fastify({ trustProxy: true });

  await app.register(rateLimit, { global: true, ...throughputPolicy, ...overwrite });

  app.setErrorHandler((error, _req, reply) => {
    const status = (error as { statusCode?: number }).statusCode;
    if (status && status < 500) return reply.code(status).send({ message: (error as Error).message });
    return reply.code(500).send({ message: "Erro interno" });
  });

  app.get("/api/health", async () => ({ ok: true }));
  app.get("/api/qualquer", async () => ({ ok: true }));

  return app;
}

const bater = (app: Awaited<ReturnType<typeof testServer>>, url: string, ip = "1.1.1.1") =>
  app.inject({ method: "GET", url, remoteAddress: ip });

describe("política de vazão", () => {
  it("deixa passar quem está dentro do teto", async () => {
    const app = await testServer({ max: 3 });

    for (let i = 0; i < 3; i++) {
      expect((await bater(app, "/api/qualquer")).statusCode).toBe(200);
    }

    await app.close();
  });

  it("responde 429 com `message` legível ao estourar", async () => {
    const app = await testServer({ max: 3 });

    for (let i = 0; i < 3; i++) await bater(app, "/api/qualquer");
    const barred = await bater(app, "/api/qualquer");

    expect(barred.statusCode).toBe(429);
    expect(barred.json()).toHaveProperty("message");
    expect(barred.json().message).toMatch(/muitas requisições/i);

    await app.close();
  });

  it("cada IP tem o próprio balde — um abusador não derruba os outros", async () => {
    const app = await testServer({ max: 3 });

    for (let i = 0; i < 4; i++) await bater(app, "/api/qualquer", "9.9.9.9");
    expect((await bater(app, "/api/qualquer", "9.9.9.9")).statusCode).toBe(429);

    expect((await bater(app, "/api/qualquer", "2.2.2.2")).statusCode).toBe(200);

    await app.close();
  });

  it("o health nunca é barrado, senão a sonda declara a API morta quando ela só está ocupada", async () => {
    const app = await testServer({ max: 3 });

    for (let i = 0; i < 20; i++) {
      expect((await bater(app, "/api/health")).statusCode).toBe(200);
    }

    await app.close();
  });

  it("o teto padrão aguenta uma carga de tela cheia várias vezes", async () => {
    expect(throughputPolicy.max).toBeGreaterThanOrEqual(200);
  });
});
