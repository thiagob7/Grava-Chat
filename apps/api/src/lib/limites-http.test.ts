import { createServer, type Server } from "node:http";
import { describe, expect, it } from "vitest";

import { TETO_DE_CABECALHO } from "~/lib/limites-http.js";

/// Sobe um servidor mínimo e devolve a porta em que ele atende.
async function servir(maxHeaderSize?: number): Promise<{ porta: number; parar: () => void }> {
  const servidor: Server = createServer(
    maxHeaderSize ? { maxHeaderSize } : {},
    (_pedido, resposta) => {
      resposta.writeHead(200).end("ok");
    },
  );

  await new Promise<void>((pronto) => servidor.listen(0, "127.0.0.1", pronto));

  const endereco = servidor.address();
  if (typeof endereco === "string" || !endereco) throw new Error("sem porta");

  return { porta: endereco.port, parar: () => servidor.close() };
}

const cookieDe = (tamanho: number) => `lixo=${"x".repeat(tamanho)}`;

async function pedir(porta: number, cookie: string) {
  const resposta = await fetch(`http://127.0.0.1:${porta}/`, { headers: { cookie } });
  return resposta.status;
}

describe("teto de cabeçalho", () => {
  it("é maior que o padrão do Node, senão não adiantaria mexer", () => {
    expect(TETO_DE_CABECALHO).toBeGreaterThan(16 * 1024);
  });

  /*
    Sem o teto maior, um cookie de 20 KB derruba o pedido — que é exatamente o
    que acontece em localhost com vários projetos na mesma máquina.
  */
  it("no padrão do Node, cookie de 20 KB volta 431", async () => {
    const { porta, parar } = await servir();

    await expect(pedir(porta, cookieDe(20_000))).resolves.toBe(431);

    parar();
  });

  it("com o nosso teto, o mesmo cookie passa", async () => {
    const { porta, parar } = await servir(TETO_DE_CABECALHO);

    await expect(pedir(porta, cookieDe(20_000))).resolves.toBe(200);

    parar();
  });

  it("acima do nosso teto ainda corta, que é o ponto de haver teto", async () => {
    const { porta, parar } = await servir(TETO_DE_CABECALHO);

    await expect(pedir(porta, cookieDe(TETO_DE_CABECALHO + 5_000))).resolves.toBe(431);

    parar();
  });
});
