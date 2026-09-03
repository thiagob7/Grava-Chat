import { beforeEach, describe, expect, it, vi } from "vitest";

const findAllForUser = vi.fn();
const mapFor = vi.fn();

vi.mock("~/repositories/friendship-repository.js", () => ({
  friendshipRepository: {
    findAllForUser: (...a: unknown[]) => findAllForUser(...a),
  },
}));

vi.mock("~/services/presence-service.js", () => ({
  presenceService: { mapFor: (...a: unknown[]) => mapFor(...a) },
}));

const { friendshipService } = await import("~/services/friendship-service.js");

const pessoa = (id: string) => ({
  id,
  username: id,
  displayName: id,
  avatarUrl: null,
  status: "OFFLINE",
  isBot: false,
});

const relacao = (
  id: string,
  requesterId: string,
  addresseeId: string,
  status: "ACCEPTED" | "PENDING" | "BLOCKED",
) => ({
  id,
  requesterId,
  addresseeId,
  status,
  createdAt: new Date("2026-09-03T00:00:00Z"),
  requester: pessoa(requesterId),
  addressee: pessoa(addresseeId),
});

beforeEach(() => {
  vi.clearAllMocks();
  mapFor.mockResolvedValue({});
});

describe("lista de relações", () => {
  it("mostra quem EU bloqueei", async () => {
    findAllForUser.mockResolvedValue([relacao("r1", "eu", "outra", "BLOCKED")]);

    const lista = await friendshipService.list("eu");

    expect(lista).toHaveLength(1);
    expect(lista[0]?.status).toBe("BLOCKED");
    expect(lista[0]?.user.id).toBe("outra");
  });

  /*
    O bloqueio mora numa linha só, e ela aparecia dos dois lados. A tela nunca
    desenhou — as abas filtram por ACCEPTED e PENDING —, mas o dado saía do
    servidor, e quem olhasse a resposta da rede sabia que tinha sido bloqueado.
  */
  it("não conta pra ninguém que foi bloqueado", async () => {
    findAllForUser.mockResolvedValue([relacao("r1", "outra", "eu", "BLOCKED")]);

    await expect(friendshipService.list("eu")).resolves.toEqual([]);
  });

  it("continua entregando amizade e pedido dos dois lados", async () => {
    findAllForUser.mockResolvedValue([
      relacao("r1", "eu", "amiga", "ACCEPTED"),
      relacao("r2", "eu", "convidada", "PENDING"),
      relacao("r3", "quem-pediu", "eu", "PENDING"),
    ]);

    const lista = await friendshipService.list("eu");

    expect(lista.map((r) => r.status)).toEqual([
      "ACCEPTED",
      "PENDING_OUT",
      "PENDING_IN",
    ]);
  });
});
