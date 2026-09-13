import { beforeEach, describe, expect, it, vi } from "vitest";

const findAllForUser = vi.fn();
const mapFor = vi.fn();

const findBetween = vi.fn();
const dmFindBetween = vi.fn();
const dmCreate = vi.fn();
const guildIdsInCommon = vi.fn();
const friendIdsInCommon = vi.fn();
const requestByChannel = vi.fn();
const requestCreate = vi.fn();
const requestReopen = vi.fn();
const requestAccept = vi.fn();
const findUser = vi.fn();
const emit = vi.fn();

vi.mock("~/repositories/friendship-repository.js", () => ({
  friendshipRepository: {
    findAllForUser: (...a: unknown[]) => findAllForUser(...a),
    findBetween: (...a: unknown[]) => findBetween(...a),
  },
  dmRepository: {
    findBetween: (...a: unknown[]) => dmFindBetween(...a),
    create: (...a: unknown[]) => dmCreate(...a),
  },
  mutualRepository: {
    guildIdsInCommon: (...a: unknown[]) => guildIdsInCommon(...a),
    friendIdsInCommon: (...a: unknown[]) => friendIdsInCommon(...a),
  },
  dmRepositoryRequest: {
    findByChannel: (...a: unknown[]) => requestByChannel(...a),
    create: (...a: unknown[]) => requestCreate(...a),
    reopen: (...a: unknown[]) => requestReopen(...a),
    accept: (...a: unknown[]) => requestAccept(...a),
  },
}));

vi.mock("~/repositories/user-repository.js", () => ({
  userRepository: { findById: (...a: unknown[]) => findUser(...a) },
}));

vi.mock("~/repositories/guild-repository.js", () => ({
  channelRepository: {},
  guildRepository: {},
  memberRepository: {},
}));

vi.mock("~/services/voice-service.js", () => ({ voiceService: {} }));

vi.mock("~/realtime/io.js", () => ({
  io: () => ({ to: () => ({ emit: (...a: unknown[]) => emit(...a) }) }),
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

const channel = { id: "c1", guildId: null, name: "dm", type: "TEXT", recipients: ["eu", "outra"], isPrivate: true };

const destination = (change: Partial<{ membersAllowDm: boolean }> = {}) => ({
  id: "outra",
  isBot: false,
  system: false,
  membersAllowDm: true,
  spamFilter: "NENHUM",
  ...change,
});

describe("abrir conversa com quem não pode receber", () => {
  beforeEach(() => {
    findBetween.mockResolvedValue(null);
    dmFindBetween.mockResolvedValue(null);
    dmCreate.mockResolvedValue(channel);
  });

  it("abre a conversa em silêncio, sem pedido para a outra pessoa", async () => {
    findUser.mockResolvedValue(destination({ membersAllowDm: false }));

    const opened = await friendshipService.openDm("eu", "outra");

    expect(opened.silent).toBe(true);
    expect(requestCreate).toHaveBeenCalledWith("c1", "eu", "outra", false, "UNDELIVERED");
  });

  it("sem comunidade em comum também fica em silêncio", async () => {
    findUser.mockResolvedValue(destination());
    guildIdsInCommon.mockResolvedValue([]);

    await expect(friendshipService.openDm("eu", "outra")).resolves.toMatchObject({ silent: true });
  });

  it("quem pode receber continua ganhando o pedido de sempre", async () => {
    findUser.mockResolvedValue(destination());
    guildIdsInCommon.mockResolvedValue(["g1"]);

    const opened = await friendshipService.openDm("eu", "outra");

    expect(opened).toMatchObject({ request: true, silent: false });
    expect(requestCreate).toHaveBeenCalledWith("c1", "eu", "outra", false);
  });
});

describe("enviar numa conversa que não entrega", () => {
  it("recusa com o motivo enquanto nada mudou", async () => {
    requestByChannel.mockResolvedValue({ status: "UNDELIVERED" });
    findBetween.mockResolvedValue(null);

    await expect(
      friendshipService.requireDeliverable("eu", "c1", destination({ membersAllowDm: false })),
    ).rejects.toMatchObject({ reason: "nao-entregue" });
    expect(emit).not.toHaveBeenCalled();
  });

  it("vira pedido de verdade quando passa a dar para entregar", async () => {
    requestByChannel.mockResolvedValue({ status: "UNDELIVERED" });
    findBetween.mockResolvedValue(null);
    guildIdsInCommon.mockResolvedValue(["g1"]);

    await friendshipService.requireDeliverable("eu", "c1", destination());

    expect(requestReopen).toHaveBeenCalledWith("c1", "eu", "outra", false);
    expect(emit).toHaveBeenCalledWith("dm:pedido", { channelId: "c1" });
  });

  it("amizade feita depois libera a conversa inteira", async () => {
    requestByChannel.mockResolvedValue({ status: "UNDELIVERED" });
    findBetween.mockResolvedValue({ status: "ACCEPTED" });

    await friendshipService.requireDeliverable("eu", "c1", destination({ membersAllowDm: false }));

    expect(requestAccept).toHaveBeenCalledWith("c1");
  });

  it("conversa comum não é tocada", async () => {
    requestByChannel.mockResolvedValue({ status: "PENDING" });

    await friendshipService.requireDeliverable("eu", "c1", destination({ membersAllowDm: false }));

    expect(findBetween).not.toHaveBeenCalled();
  });
});
