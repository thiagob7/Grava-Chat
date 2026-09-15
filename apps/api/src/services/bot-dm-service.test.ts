import { beforeEach, describe, expect, it, vi } from "vitest";

const findUser = vi.fn();
const inCommon = vi.fn();
const openDm = vi.fn();
const emit = vi.fn();
let uses = 0;

vi.mock("~/repositories/user-repository.js", () => ({
  userRepository: { findById: (...a: unknown[]) => findUser(...a) },
}));

vi.mock("~/repositories/friendship-repository.js", () => ({
  mutualRepository: { guildIdsInCommon: (...a: unknown[]) => inCommon(...a) },
}));

vi.mock("~/services/friendship-service.js", () => ({
  friendshipService: { openDm: (...a: unknown[]) => openDm(...a) },
}));

vi.mock("~/realtime/io.js", () => ({ io: () => ({ to: () => ({ emit }) }) }));

vi.mock("~/lib/redis.js", () => ({
  redis: { incr: vi.fn(async () => ++uses), expire: vi.fn() },
  keys: { botDmRate: (id: string) => `bot:dm:rate:${id}` },
}));

const { botDmService } = await import("~/services/bot-dm-service.js");

const BOT = "6a8781da7415b08f427be1a4";
const PERSON = "6a8781f57415b08f427be1ad";

beforeEach(() => {
  vi.clearAllMocks();
  uses = 0;
  findUser.mockResolvedValue({ id: PERSON, isBot: false, system: false });
  inCommon.mockResolvedValue(["g1"]);
  openDm.mockResolvedValue({ channel: { id: "dm1" }, request: true, silent: false });
});

describe("bot direct messages", () => {
  it("opens the conversation through the normal DM rules and tells the person", async () => {
    await expect(botDmService.openFor(BOT, PERSON)).resolves.toBe("dm1");

    expect(openDm).toHaveBeenCalledWith(BOT, PERSON);
    expect(emit).toHaveBeenCalledWith("dm:pedido", { channelId: "dm1" });
  });

  it("refuses people who share no server with the bot", async () => {
    inCommon.mockResolvedValue([]);
    await expect(botDmService.openFor(BOT, PERSON)).rejects.toThrow("share a server");
    expect(openDm).not.toHaveBeenCalled();
  });

  it("refuses other bots and the bot itself", async () => {
    findUser.mockResolvedValue({ id: PERSON, isBot: true, system: false });
    await expect(botDmService.openFor(BOT, PERSON)).rejects.toThrow("other bots");
    await expect(botDmService.openFor(BOT, BOT)).rejects.toThrow("itself");
  });

  it("stops after too many direct messages in a minute", async () => {
    uses = 30;
    await expect(botDmService.openFor(BOT, PERSON)).rejects.toThrow("Too many");
  });
});
