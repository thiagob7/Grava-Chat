import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotFoundError } from "~/lib/http.js";

const smembers = vi.fn();
const mget = vi.fn();
const srem = vi.fn();
const getdel = vi.fn();

let transaction: unknown[][] = [];

const multi = () => {
  const steps: Record<string, unknown> = {};

  for (const name of ["set", "sadd", "expire", "del", "srem"]) {
    steps[name] = (...a: unknown[]) => {
      transaction.push([name, ...a]);
      return steps;
    };
  }

  steps.exec = async () => [];
  return steps;
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
    oauthCode: (code: string) => `oauth:code:${code}`,
    oauthToken: (token: string) => `oauth:token:${token}`,
    personOauth: (userId: string) => `oauth:usuario:${userId}`,
  },
}));

const searchBot = vi.fn();

vi.mock("~/repositories/bot-repository.js", () => ({
  botRepository: { findById: (...a: unknown[]) => searchBot(...a) },
}));

const { oauthService } = await import("~/services/oauth-service.js");

const bot = (id: string, name: string) => ({
  id,
  description: `bot ${name}`,
  clientSecret: "segredo",
  botUserId: `u-${id}`,
  redirectUris: ["https://painel.exemplo/volta"],
  user: {
    id: `u-${id}`,
    username: name,
    displayName: name,
    avatarUrl: null,
    status: "ONLINE",
    isBot: true,
  },
});

const token = (data: Record<string, unknown>) => JSON.stringify(data);

beforeEach(() => {
  vi.clearAllMocks();
  transaction = [];
  searchBot.mockImplementation(async (id: string) => bot(id, `app-${id}`));
});

describe("índice das aplicações autorizadas", () => {
  it("agrupa por aplicação, soma os escopos e fica com a autorização mais nova", async () => {
    const old = Date.parse("2026-08-01T10:00:00Z");
    const fresh = Date.parse("2026-09-01T10:00:00Z");

    smembers.mockResolvedValue(["t1", "t2"]);
    mget.mockResolvedValue([
      token({ userId: "eu", botId: "b1", scopes: ["identify"], createdAt: old }),
      token({ userId: "eu", botId: "b1", scopes: ["guilds"], createdAt: fresh }),
    ]);

    const list = await oauthService.listAuthorized("eu");

    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe("b1");
    expect([...(list[0]?.scopes ?? [])].sort()).toEqual(["guilds", "identify"]);
    expect(list[0]?.authorizedAt).toBe(new Date(fresh).toISOString());
    expect(srem).not.toHaveBeenCalled();
  });

  it("poda do índice o token que já venceu e não mostra a aplicação dele", async () => {
    smembers.mockResolvedValue(["vivo", "vencido"]);
    mget.mockResolvedValue([
      token({ userId: "eu", botId: "b1", scopes: ["identify"], createdAt: Date.now() }),
      null,
    ]);

    const list = await oauthService.listAuthorized("eu");

    expect(list.map((a) => a.id)).toEqual(["b1"]);
    expect(srem).toHaveBeenCalledWith("oauth:usuario:eu", "vencido");
  });

  it("descarta o token que não é desta pessoa em vez de mostrar o acesso alheio", async () => {
    smembers.mockResolvedValue(["intruso"]);
    mget.mockResolvedValue([token({ userId: "outra", botId: "b9", scopes: ["identify"] })]);

    await expect(oauthService.listAuthorized("eu")).resolves.toEqual([]);
    expect(srem).toHaveBeenCalledWith("oauth:usuario:eu", "intruso");
  });

  it("não desenha cartão de aplicação apagada", async () => {
    smembers.mockResolvedValue(["t1"]);
    mget.mockResolvedValue([token({ userId: "eu", botId: "sumiu", scopes: ["identify"] })]);
    searchBot.mockResolvedValue(null);

    await expect(oauthService.listAuthorized("eu")).resolves.toEqual([]);
  });
});

describe("revogar uma aplicação", () => {
  it("apaga TODOS os tokens dela e tira todos do índice", async () => {
    smembers.mockResolvedValue(["t1", "t2", "t3"]);
    mget.mockResolvedValue([
      token({ userId: "eu", botId: "b1", scopes: ["identify"] }),
      token({ userId: "eu", botId: "b2", scopes: ["identify"] }),
      token({ userId: "eu", botId: "b1", scopes: ["guilds"] }),
    ]);

    await expect(oauthService.revokeApplication("eu", "b1")).resolves.toEqual({ revoked: 2 });

    expect(transaction).toEqual([
      ["del", "oauth:token:t1", "oauth:token:t3"],
      ["srem", "oauth:usuario:eu", "t1", "t3"],
    ]);
  });

  it("não deixa o id de uma aplicação derrubar a autorização de outra pessoa", async () => {
    smembers.mockResolvedValue(["t1"]);
    mget.mockResolvedValue([token({ userId: "outra", botId: "b1", scopes: ["identify"] })]);

    await expect(oauthService.revokeApplication("eu", "b1")).rejects.toBeInstanceOf(NotFoundError);
    expect(transaction).toEqual([]);
  });

  it("reclama quando a aplicação não tem acesso nenhum", async () => {
    smembers.mockResolvedValue([]);

    await expect(oauthService.revokeApplication("eu", "b1")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("emissão do token", () => {
  it("grava o token e a entrada do índice na mesma transação", async () => {
    getdel.mockResolvedValue(
      JSON.stringify({
        userId: "eu",
        botId: "b1",
        scopes: ["identify"],
        redirectUri: "https://painel.exemplo/volta",
      }),
    );

    const reply = await oauthService.swapCode({
      code: "c1",
      clientId: "b1",
      clientSecret: "segredo",
      redirectUri: "https://painel.exemplo/volta",
    });

    const [recorded, index, validity] = transaction;

    expect(recorded?.[0]).toBe("set");
    expect(recorded?.[1]).toBe(`oauth:token:${reply.access_token}`);
    expect(index).toEqual(["sadd", "oauth:usuario:eu", reply.access_token]);
    expect(validity).toEqual(["expire", "oauth:usuario:eu", 7 * 24 * 60 * 60]);
  });
});
