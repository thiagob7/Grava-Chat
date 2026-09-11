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

const person = (id: string) => ({
  id,
  username: id,
  displayName: id,
  avatarUrl: null,
  status: "OFFLINE",
  isBot: false,
});

const relation = (
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
  requester: person(requesterId),
  addressee: person(addresseeId),
});

beforeEach(() => {
  vi.clearAllMocks();
  mapFor.mockResolvedValue({});
});

describe("lista de relações", () => {
  it("mostra quem EU bloqueei", async () => {
    findAllForUser.mockResolvedValue([relation("r1", "eu", "outra", "BLOCKED")]);

    const list = await friendshipService.list("eu");

    expect(list).toHaveLength(1);
    expect(list[0]?.status).toBe("BLOCKED");
    expect(list[0]?.user.id).toBe("outra");
  });

  it("não conta pra ninguém que foi bloqueado", async () => {
    findAllForUser.mockResolvedValue([relation("r1", "outra", "eu", "BLOCKED")]);

    await expect(friendshipService.list("eu")).resolves.toEqual([]);
  });

  it("continua entregando amizade e pedido dos dois lados", async () => {
    findAllForUser.mockResolvedValue([
      relation("r1", "eu", "amiga", "ACCEPTED"),
      relation("r2", "eu", "convidada", "PENDING"),
      relation("r3", "quem-pediu", "eu", "PENDING"),
    ]);

    const list = await friendshipService.list("eu");

    expect(list.map((r) => r.status)).toEqual([
      "ACCEPTED",
      "PENDING_OUT",
      "PENDING_IN",
    ]);
  });
});
