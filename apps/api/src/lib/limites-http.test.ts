import { createServer, type Server } from "node:http";
import { describe, expect, it } from "vitest";

import { HEADER_CEILING } from "~/lib/limites-http.js";

async function serve(maxHeaderSize?: number): Promise<{ porta: number; stop: () => void }> {
  const server: Server = createServer(
    maxHeaderSize ? { maxHeaderSize } : {},
    (_request, reply) => {
      reply.writeHead(200).end("ok");
    },
  );

  await new Promise<void>((ready) => server.listen(0, "127.0.0.1", ready));

  const address = server.address();
  if (typeof address === "string" || !address) throw new Error("sem porta");

  return { porta: address.port, stop: () => server.close() };
}

const cookieDe = (size: number) => `lixo=${"x".repeat(size)}`;

async function askFor(porta: number, cookie: string) {
  const reply = await fetch(`http://127.0.0.1:${porta}/`, { headers: { cookie } });
  return reply.status;
}

describe("teto de cabeçalho", () => {
  it("é maior que o padrão do Node, senão não adiantaria mexer", () => {
    expect(HEADER_CEILING).toBeGreaterThan(16 * 1024);
  });

  it("no padrão do Node, cookie de 20 KB volta 431", async () => {
    const { porta, stop } = await serve();

    await expect(askFor(porta, cookieDe(20_000))).resolves.toBe(431);

    stop();
  });

  it("com o nosso teto, o mesmo cookie passa", async () => {
    const { porta, stop } = await serve(HEADER_CEILING);

    await expect(askFor(porta, cookieDe(20_000))).resolves.toBe(200);

    stop();
  });

  it("acima do nosso teto ainda corta, que é o ponto de haver teto", async () => {
    const { porta, stop } = await serve(HEADER_CEILING);

    await expect(askFor(porta, cookieDe(HEADER_CEILING + 5_000))).resolves.toBe(431);

    stop();
  });
});
