import { describe, expect, it, vi } from "vitest";
import type { FastifyRequest } from "fastify";

const SECRET = "s".repeat(40);

vi.mock("~/env.js", () => ({ env: { EDGE_SECRET: SECRET } }));

const { clientIp, EDGE_HEADER } = await import("~/lib/ip-do-cliente.js");

const request = (headers: Record<string, string>, ip = "76.76.21.21") =>
  ({ headers, ip }) as unknown as FastifyRequest;

describe("IP de quem chamou", () => {
  it("vindo da borda com o segredo, usa o IP que a Vercel repassou", () => {
    expect(clientIp(request({ [EDGE_HEADER]: SECRET, "x-vercel-forwarded-for": "200.1.2.3" }))).toBe("200.1.2.3");
  });

  it("sem o segredo, ignora o cabeçalho inventado e fica com o IP da conexão", () => {
    expect(clientIp(request({ "x-vercel-forwarded-for": "1.2.3.4" }))).toBe("76.76.21.21");
  });

  it("com o segredo errado, também ignora", () => {
    expect(clientIp(request({ [EDGE_HEADER]: "errado", "x-vercel-forwarded-for": "1.2.3.4" }))).toBe("76.76.21.21");
  });

  it("valor que não é IP não passa", () => {
    expect(clientIp(request({ [EDGE_HEADER]: SECRET, "x-vercel-forwarded-for": "nada" }))).toBe("76.76.21.21");
  });
});
