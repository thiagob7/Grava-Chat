import Fastify from "fastify";
import { describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

vi.mock("~/env.js", () => ({ env: {}, isDev: false }));

const { errorAnswer } = await import("./erro-de-rota.js");

describe("resposta de erro", () => {
  it("erro do provedor de pagamento não vaza detalhe para a tela", () => {
    const stripeError = Object.assign(new Error("The provided key 'rk_test_…' does not have permissions"), {
      type: "StripePermissionError",
      statusCode: 403,
    });

    expect(errorAnswer(stripeError)).toEqual({
      status: 502,
      body: { message: "Não deu para falar com o pagamento agora. Tente de novo." },
      log: true,
    });
  });

  it("erro nosso continua chegando com a mensagem escrita para a pessoa", async () => {
    const { AppError } = await import("./http.js");
    expect(errorAnswer(new AppError("Você já tem uma assinatura", 409))).toEqual({
      status: 409,
      body: { message: "Você já tem uma assinatura" },
      log: false,
    });
  });

  it("dados inválidos viram 400 com o primeiro problema", () => {
    const zod = new ZodError([{ code: "custom", path: ["content"], message: "muito longo" }]);
    const answer = errorAnswer(zod);

    expect(answer.status).toBe(400);
    expect(answer.body.message).toBe("muito longo");
  });

  it("erro desconhecido não mostra o que aconteceu", () => {
    expect(errorAnswer(new Error("connect ECONNREFUSED 10.0.0.9:27017"))).toEqual({
      status: 500,
      body: { message: "Erro interno" },
      log: true,
    });
  });
});
