import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotFoundError } from "~/lib/http.js";

const smembers = vi.fn();
const mget = vi.fn();
const srem = vi.fn();
const getdel = vi.fn();

let transacao: unknown[][] = [];

const multi = () => {
  const passos: Record<string, unknown> = {};

  for (const nome of ["set", "sadd", "expire", "del", "srem"]) {
    passos[nome] = (...a: unknown[]) => {
      transacao.push([nome, ...a]);
      return passos;
    };
  }

  passos.exec = async () => [];
  return passos;
};

vi.mock("~/lib/redis.js", () => ({
  redis: {
    smembers: (...a: unknown[]) => smembers(...a),
    mget: (...a: unknown[]) => mget(...a),
    srem: (...a: unknown[]) => srem(...a),
    getdel: (...a: unknown[]) => getdel(...a),
    multi,
  },
  keys: {
    oauthCode: (codigo: string) => `oauth:code:${codigo}`,
    oauthToken: (token: string) => `oauth:token:${token}`,
    oauthDaPessoa: (userId: string) => `oauth:usuario:${userId}`,
  },
}));

const buscarBot = vi.fn();

vi.mock("~/repositories/bot-repository.js", () => ({
  botRepository: { findById: (...a: unknown[]) => buscarBot(...a) },
}));

const { oauthService } = await import("~/services/oauth-service.js");

const bot = (id: string, nome: string) => ({
  id,
  descricao: `bot ${nome}`,
  clientSecret: "segredo",
  botUserId: `u-${id}`,
  redirectUris: ["https://painel.exemplo/volta"],
  usuario: {
    id: `u-${id}`,
    username: nome,
    displayName: nome,
    avatarUrl: null,
    status: "ONLINE",
    isBot: true,
  },
});

const token = (dados: Record<string, unknown>) => JSON.stringify(dados);

beforeEach(() => {
  vi.clearAllMocks();
  transacao = [];
  buscarBot.mockImplementation(async (id: string) => bot(id, `app-${id}`));
});

describe("índice das aplicações autorizadas", () => {
  it("agrupa por aplicação, soma os escopos e fica com a autorização mais nova", async () => {
    const velho = Date.parse("2026-08-01T10:00:00Z");
    const novo = Date.parse("2026-09-01T10:00:00Z");

    smembers.mockResolvedValue(["t1", "t2"]);
    mget.mockResolvedValue([
      token({ userId: "eu", botId: "b1", escopos: ["identify"], criadoEm: velho }),
      token({ userId: "eu", botId: "b1", escopos: ["guilds"], criadoEm: novo }),
    ]);

    const lista = await oauthService.listarAutorizadas("eu");

    expect(lista).toHaveLength(1);
    expect(lista[0]?.id).toBe("b1");
    expect([...(lista[0]?.escopos ?? [])].sort()).toEqual(["guilds", "identify"]);
    expect(lista[0]?.autorizadoEm).toBe(new Date(novo).toISOString());
    expect(srem).not.toHaveBeenCalled();
  });

  it("poda do índice o token que já venceu e não mostra a aplicação dele", async () => {
    smembers.mockResolvedValue(["vivo", "vencido"]);
    mget.mockResolvedValue([
      token({ userId: "eu", botId: "b1", escopos: ["identify"], criadoEm: Date.now() }),
      null,
    ]);

    const lista = await oauthService.listarAutorizadas("eu");

    expect(lista.map((a) => a.id)).toEqual(["b1"]);
    expect(srem).toHaveBeenCalledWith("oauth:usuario:eu", "vencido");
  });

  it("descarta o token que não é desta pessoa em vez de mostrar o acesso alheio", async () => {
    smembers.mockResolvedValue(["intruso"]);
    mget.mockResolvedValue([token({ userId: "outra", botId: "b9", escopos: ["identify"] })]);

    await expect(oauthService.listarAutorizadas("eu")).resolves.toEqual([]);
    expect(srem).toHaveBeenCalledWith("oauth:usuario:eu", "intruso");
  });

  it("não desenha cartão de aplicação apagada", async () => {
    smembers.mockResolvedValue(["t1"]);
    mget.mockResolvedValue([token({ userId: "eu", botId: "sumiu", escopos: ["identify"] })]);
    buscarBot.mockResolvedValue(null);

    await expect(oauthService.listarAutorizadas("eu")).resolves.toEqual([]);
  });
});

describe("revogar uma aplicação", () => {
  it("apaga TODOS os tokens dela e tira todos do índice", async () => {
    smembers.mockResolvedValue(["t1", "t2", "t3"]);
    mget.mockResolvedValue([
      token({ userId: "eu", botId: "b1", escopos: ["identify"] }),
      token({ userId: "eu", botId: "b2", escopos: ["identify"] }),
      token({ userId: "eu", botId: "b1", escopos: ["guilds"] }),
    ]);

    await expect(oauthService.revogarAplicacao("eu", "b1")).resolves.toEqual({ revogados: 2 });

    expect(transacao).toEqual([
      ["del", "oauth:token:t1", "oauth:token:t3"],
      ["srem", "oauth:usuario:eu", "t1", "t3"],
    ]);
  });

  it("não deixa o id de uma aplicação derrubar a autorização de outra pessoa", async () => {
    smembers.mockResolvedValue(["t1"]);
    mget.mockResolvedValue([token({ userId: "outra", botId: "b1", escopos: ["identify"] })]);

    await expect(oauthService.revogarAplicacao("eu", "b1")).rejects.toBeInstanceOf(NotFoundError);
    expect(transacao).toEqual([]);
  });

  it("reclama quando a aplicação não tem acesso nenhum", async () => {
    smembers.mockResolvedValue([]);

    await expect(oauthService.revogarAplicacao("eu", "b1")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("emissão do token", () => {
  it("grava o token e a entrada do índice na mesma transação", async () => {
    getdel.mockResolvedValue(
      JSON.stringify({
        userId: "eu",
        botId: "b1",
        escopos: ["identify"],
        redirectUri: "https://painel.exemplo/volta",
      }),
    );

    const resposta = await oauthService.trocarCodigo({
      codigo: "c1",
      clientId: "b1",
      clientSecret: "segredo",
      redirectUri: "https://painel.exemplo/volta",
    });

    const [gravado, indice, validade] = transacao;

    expect(gravado?.[0]).toBe("set");
    expect(gravado?.[1]).toBe(`oauth:token:${resposta.access_token}`);
    expect(indice).toEqual(["sadd", "oauth:usuario:eu", resposta.access_token]);
    expect(validade).toEqual(["expire", "oauth:usuario:eu", 7 * 24 * 60 * 60]);
  });
});
