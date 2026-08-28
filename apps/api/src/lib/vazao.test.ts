import { describe, expect, it } from "vitest";
import Fastify from "fastify";
import rateLimit from "@fastify/rate-limit";

import { politicaDeVazao } from "~/lib/vazao.js";

/*
  Sobe um Fastify só com a política — contador em memória, sem Redis. O que está
  sob teste são as decisões do arquivo (o teto, quem escapa, o formato do erro),
  não o ioredis.

  O `setErrorHandler` é copiado do `app.ts` de propósito: é ele que transforma o
  erro do plugin no `{ message }` que o front espera. Sem replicar aqui, o teste
  passaria com o formato padrão do Fastify e não provaria nada sobre o que a API
  de verdade responde.
*/
async function servidorDeTeste(sobrescrever: Partial<typeof politicaDeVazao> = {}) {
  const app = Fastify({ trustProxy: true });

  await app.register(rateLimit, { global: true, ...politicaDeVazao, ...sobrescrever });

  app.setErrorHandler((error, _req, reply) => {
    const status = (error as { statusCode?: number }).statusCode;
    if (status && status < 500) return reply.code(status).send({ message: (error as Error).message });
    return reply.code(500).send({ message: "Erro interno" });
  });

  app.get("/api/health", async () => ({ ok: true }));
  app.get("/api/qualquer", async () => ({ ok: true }));

  return app;
}

const bater = (app: Awaited<ReturnType<typeof servidorDeTeste>>, url: string, ip = "1.1.1.1") =>
  app.inject({ method: "GET", url, remoteAddress: ip });

describe("política de vazão", () => {
  it("deixa passar quem está dentro do teto", async () => {
    const app = await servidorDeTeste({ max: 3 });

    for (let i = 0; i < 3; i++) {
      expect((await bater(app, "/api/qualquer")).statusCode).toBe(200);
    }

    await app.close();
  });

  it("responde 429 com `message` legível ao estourar", async () => {
    const app = await servidorDeTeste({ max: 3 });

    for (let i = 0; i < 3; i++) await bater(app, "/api/qualquer");
    const barrado = await bater(app, "/api/qualquer");

    expect(barrado.statusCode).toBe(429);
    // o front monta o toast a partir de `message`; um corpo fora desse formato
    // apareceria como erro genérico na tela
    expect(barrado.json()).toHaveProperty("message");
    expect(barrado.json().message).toMatch(/muitas requisições/i);

    await app.close();
  });

  it("cada IP tem o próprio balde — um abusador não derruba os outros", async () => {
    const app = await servidorDeTeste({ max: 3 });

    for (let i = 0; i < 4; i++) await bater(app, "/api/qualquer", "9.9.9.9");
    expect((await bater(app, "/api/qualquer", "9.9.9.9")).statusCode).toBe(429);

    // o vizinho de NAT diferente continua atendido
    expect((await bater(app, "/api/qualquer", "2.2.2.2")).statusCode).toBe(200);

    await app.close();
  });

  it("o health nunca é barrado, senão a sonda declara a API morta quando ela só está ocupada", async () => {
    const app = await servidorDeTeste({ max: 3 });

    for (let i = 0; i < 20; i++) {
      expect((await bater(app, "/api/health")).statusCode).toBe(200);
    }

    await app.close();
  });

  it("o teto padrão aguenta uma carga de tela cheia várias vezes", async () => {
    // pino o número: baixá-lo sem pensar quebraria a abertura do app, que
    // dispara de 30 a 50 chamadas de uma vez
    expect(politicaDeVazao.max).toBeGreaterThanOrEqual(200);
  });
});
