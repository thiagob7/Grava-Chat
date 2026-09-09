import { beforeEach, describe, expect, it, vi } from "vitest";

const create = vi.fn();
const count = vi.fn();
const findMany = vi.fn();
const findUnique = vi.fn();
const update = vi.fn();
const updateMany = vi.fn();
const findChannel = vi.fn();
const requirePermission = vi.fn();
const requireMember = vi.fn();

vi.mock("~/lib/prisma.js", () => ({
  prisma: {
    guildEvent: {
      create: (...a: unknown[]) => create(...a),
      count: (...a: unknown[]) => count(...a),
      findMany: (...a: unknown[]) => findMany(...a),
      findUnique: (...a: unknown[]) => findUnique(...a),
      update: (...a: unknown[]) => update(...a),
      updateMany: (...a: unknown[]) => updateMany(...a),
    },
  },
}));

vi.mock("~/repositories/guild-repository.js", () => ({
  channelRepository: {
    findById: (...a: unknown[]) => findChannel(...a),
    findManyByGuild: async () => [{ id: "c1", name: "Sala" }],
  },
}));

vi.mock("~/repositories/user-repository.js", () => ({
  userRepository: {
    findByIdOrThrow: async (id: string) => ({
      id,
      username: "thiago",
      displayName: "Thiago",
      avatarUrl: null,
    }),
    findManyByIds: async (ids: string[]) =>
      ids.map((id) => ({ id, username: "thiago", displayName: "Thiago", avatarUrl: null })),
  },
}));

vi.mock("~/services/access-service.js", () => ({
  accessService: {
    requirePermission: (...a: unknown[]) => requirePermission(...a),
    requireMember: (...a: unknown[]) => requireMember(...a),
  },
}));

const { guildEventService } = await import("~/services/guild-event-service.js");

const row = (extras: Record<string, unknown> = {}) => ({
  id: "e1",
  guildId: "g1",
  authorId: "u1",
  name: "Treino de terça",
  description: null,
  imageUrl: null,
  startsAt: new Date("2026-09-15T22:00:00Z"),
  frequency: "weekly",
  channelId: "c1",
  externalLocation: null,
  interestedIds: ["u1"],
  startedAt: null,
  canceledAt: null,
  ...extras,
});

const input = (extras: Record<string, unknown> = {}) => ({
  name: "Treino de terça",
  startsAt: "2026-09-15T22:00:00.000Z",
  frequency: "weekly" as const,
  channelId: "c1",
  ...extras,
});

beforeEach(() => {
  vi.clearAllMocks();
  count.mockResolvedValue(0);
  findChannel.mockResolvedValue({ id: "c1", guildId: "g1", name: "Sala", type: "VOICE" });
  create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => row(data));
  update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => row(data));
  findUnique.mockResolvedValue(row());
});

describe("where the event happens", () => {
  it("refuses a channel and an outside place at the same time", async () => {
    await expect(
      guildEventService.create("u1", "g1", input({ externalLocation: "Parque da cidade" })),
    ).rejects.toThrow(/OU/);
  });

  it("refuses neither of them", async () => {
    await expect(
      guildEventService.create("u1", "g1", input({ channelId: null })),
    ).rejects.toThrow(/OU/);
  });

  it("refuses a text channel", async () => {
    findChannel.mockResolvedValue({ id: "c1", guildId: "g1", name: "geral", type: "TEXT" });

    await expect(guildEventService.create("u1", "g1", input())).rejects.toThrow(/canal de voz/);
  });

  it("refuses a channel from another guild", async () => {
    findChannel.mockResolvedValue({ id: "c1", guildId: "outra", name: "Sala", type: "VOICE" });

    await expect(guildEventService.create("u1", "g1", input())).rejects.toThrow(/não encontrado/);
  });

  it("takes an outside place with no channel", async () => {
    const created = await guildEventService.create(
      "u1",
      "g1",
      input({ channelId: null, externalLocation: "Parque da cidade" }),
    );

    expect(created.externalLocation).toBe("Parque da cidade");
    expect(created.channelName).toBeNull();
  });
});

describe("creating", () => {
  it("asks for the permission before anything else", async () => {
    await guildEventService.create("u1", "g1", input());

    expect(requirePermission).toHaveBeenCalledWith("u1", "g1", "MANAGE_EVENTS");
  });

  it("puts whoever created it on the interested list", async () => {
    const created = await guildEventService.create("u1", "g1", input());

    expect(created.interestedCount).toBe(1);
    expect(created.isInterested).toBe(true);
  });

  it("stops at the guild limit", async () => {
    count.mockResolvedValue(100);

    await expect(guildEventService.create("u1", "g1", input())).rejects.toThrow(/já tem 100/);
  });

  it("names the channel it happens in", async () => {
    const created = await guildEventService.create("u1", "g1", input());

    expect(created.channelName).toBe("Sala");
  });
});

describe("listing", () => {
  it("leaves the cancelled ones out and puts the closest first", async () => {
    findMany.mockResolvedValue([row()]);

    const list = await guildEventService.list("u1", "g1");

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          guildId: "g1",
          OR: [{ canceledAt: null }, { canceledAt: { isSet: false } }],
        },
        orderBy: { startsAt: "asc" },
      }),
    );
    expect(list.at(0)?.author?.displayName).toBe("Thiago");
  });

  it("does not touch the database when there is nothing", async () => {
    findMany.mockResolvedValue([]);

    await expect(guildEventService.list("u1", "g1")).resolves.toEqual([]);
  });
});

describe("interest", () => {
  it("adds the member once", async () => {
    findUnique.mockResolvedValue(row({ interestedIds: ["u1"] }));

    const result = await guildEventService.setInterest("u1", "g1", "e1", true);

    expect(result.interestedCount).toBe(1);
  });

  it("removes whoever gave up", async () => {
    findUnique.mockResolvedValue(row({ interestedIds: ["u1", "u2"] }));

    const result = await guildEventService.setInterest("u2", "g1", "e1", false);

    expect(result).toEqual({ id: "e1", interestedCount: 1, isInterested: false });
  });

  it("only needs to be a member", async () => {
    await guildEventService.setInterest("u2", "g1", "e1", true);

    expect(requireMember).toHaveBeenCalledWith("u2", "g1");
    expect(requirePermission).not.toHaveBeenCalled();
  });
});

describe("starting on time", () => {
  it("only starts what is due and still alive", async () => {
    updateMany.mockResolvedValue({ count: 2 });

    await expect(guildEventService.startDue()).resolves.toBe(2);
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        AND: [
          { OR: [{ startedAt: null }, { startedAt: { isSet: false } }] },
          { OR: [{ canceledAt: null }, { canceledAt: { isSet: false } }] },
          { startsAt: { lte: expect.any(Date) } },
        ],
      },
      data: { startedAt: expect.any(Date) },
    });
  });

  it("stops watching when told to", () => {
    vi.useFakeTimers();
    updateMany.mockResolvedValue({ count: 0 });

    const stop = guildEventService.watch();
    stop();
    vi.advanceTimersByTime(5 * 60_000);

    expect(updateMany).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});

describe("cancelling", () => {
  it("keeps the record and only marks the date", async () => {
    await guildEventService.cancel("u1", "g1", "e1");

    expect(update).toHaveBeenCalledWith({
      where: { id: "e1" },
      data: { canceledAt: expect.any(Date) },
    });
  });

  it("does not reach an event from another guild", async () => {
    findUnique.mockResolvedValue(row({ guildId: "outra" }));

    await expect(guildEventService.cancel("u1", "g1", "e1")).rejects.toThrow(/não encontrado/);
  });
});
