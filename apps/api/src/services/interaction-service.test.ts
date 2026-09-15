import { beforeEach, describe, expect, it, vi } from "vitest";

const findMessage = vi.fn();
const findUser = vi.fn();
const findMember = vi.fn();
const requireChannelAccess = vi.fn();
const store = new Map<string, string>();

vi.mock("~/repositories/message-repository.js", () => ({
  messageRepository: { findById: (...a: unknown[]) => findMessage(...a) },
}));

vi.mock("~/repositories/user-repository.js", () => ({
  userRepository: { findById: (...a: unknown[]) => findUser(...a) },
}));

vi.mock("~/repositories/guild-repository.js", () => ({
  memberRepository: { find: (...a: unknown[]) => findMember(...a) },
}));

vi.mock("~/services/access-service.js", () => ({
  accessService: { requireChannelAccess: (...a: unknown[]) => requireChannelAccess(...a) },
}));

vi.mock("~/lib/redis.js", () => ({
  redis: {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    set: vi.fn(async (key: string, value: string, ...rest: unknown[]) => {
      if (rest.includes("NX") && store.has(key)) return null;
      store.set(key, value);
      return "OK";
    }),
    del: vi.fn(async (key: string) => store.delete(key)),
  },
  keys: {
    interaction: (id: string) => `interaction:${id}`,
    interactionAnswered: (id: string) => `interaction:answered:${id}`,
    ephemeralMessage: (id: string) => `ephemeral:${id}`,
  },
}));

const { interactionService } = await import("~/services/interaction-service.js");

const BOT = "6a8781da7415b08f427be1a4";
const PERSON = "6a8781f57415b08f427be1ad";
const OTHER_BOT = "6a8781f57415b08f427be1ae";
const CHANNEL = "6a8781db7415b08f427be1aa";
const MESSAGE = "6a8781db7415b08f427be1ab";

const person = { id: PERSON, username: "davi", displayName: "Davi", avatarUrl: null, status: "ONLINE", isBot: false };

const storedRows = [
  {
    components: [
      { type: "button", style: "success", label: "Accept", emoji: null, customId: "accept", url: null, disabled: false, placeholder: null, minValues: null, maxValues: null, options: [] },
      { type: "button", style: "secondary", label: "Closed", emoji: null, customId: "closed", url: null, disabled: true, placeholder: null, minValues: null, maxValues: null, options: [] },
      { type: "button", style: "link", label: "Site", emoji: null, customId: null, url: "https://example.com", disabled: false, placeholder: null, minValues: null, maxValues: null, options: [] },
    ],
  },
  {
    components: [
      {
        type: "select",
        style: null,
        label: null,
        emoji: null,
        customId: "games",
        url: null,
        disabled: false,
        placeholder: null,
        minValues: 1,
        maxValues: 2,
        options: [
          { label: "Minecraft", value: "mc", description: null, emoji: null },
          { label: "Roblox", value: "rbx", description: null, emoji: null },
          { label: "Valorant", value: "val", description: null, emoji: null },
        ],
      },
    ],
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  store.clear();
  findMessage.mockResolvedValue({ id: MESSAGE, channelId: CHANNEL, authorId: BOT, deletedAt: null, components: storedRows });
  findUser.mockImplementation(async (id: string) => (id === BOT ? { id: BOT, isBot: true } : person));
  requireChannelAccess.mockResolvedValue({ channel: { id: CHANNEL, guildId: "g1" }, context: {} });
  findMember.mockResolvedValue({ roleIds: ["staff"], nickname: "Davi da loja" });
});

describe("prepare", () => {
  it("builds the event the bot receives, with the member roles", async () => {
    const { interaction, event } = await interactionService.prepare(PERSON, { messageId: MESSAGE, customId: "accept" });

    expect(interaction.botUserId).toBe(BOT);
    expect(event).toMatchObject({
      type: "component",
      customId: "accept",
      values: [],
      channelId: CHANNEL,
      member: { roleIds: ["staff"], nickname: "Davi da loja" },
    });
    expect(event.token).not.toBe(interaction.tokenHash);
  });

  it("refuses components on a message that is not from a bot", async () => {
    findUser.mockResolvedValue({ ...person, isBot: false });

    await expect(interactionService.prepare(PERSON, { messageId: MESSAGE, customId: "accept" })).rejects.toThrow(
      "Essa opção não existe mais",
    );
  });

  it("stops at channel access for someone who cannot see the channel", async () => {
    requireChannelAccess.mockRejectedValue(new Error("Canal não encontrado"));

    await expect(interactionService.prepare(PERSON, { messageId: MESSAGE, customId: "accept" })).rejects.toThrow(
      "Canal não encontrado",
    );
  });

  it("refuses a customId that does not exist and a link button", async () => {
    await expect(interactionService.prepare(PERSON, { messageId: MESSAGE, customId: "nope" })).rejects.toThrow();
    await expect(interactionService.prepare(PERSON, { messageId: MESSAGE, customId: "https://example.com" })).rejects.toThrow();
  });

  it("refuses a disabled button", async () => {
    await expect(interactionService.prepare(PERSON, { messageId: MESSAGE, customId: "closed" })).rejects.toThrow(
      "Essa opção está desativada",
    );
  });

  it("checks select values against the options and the min and max", async () => {
    await expect(
      interactionService.prepare(PERSON, { messageId: MESSAGE, customId: "games", values: ["fortnite"] }),
    ).rejects.toThrow("Opção inválida");

    await expect(
      interactionService.prepare(PERSON, { messageId: MESSAGE, customId: "games", values: ["mc", "rbx", "val"] }),
    ).rejects.toThrow("Escolha de 1 a 2 opções");

    await expect(
      interactionService.prepare(PERSON, { messageId: MESSAGE, customId: "games", values: ["mc", "mc"] }),
    ).rejects.toThrow("Opção inválida");

    const { event } = await interactionService.prepare(PERSON, { messageId: MESSAGE, customId: "games", values: ["mc", "val"] });
    expect(event.values).toEqual(["mc", "val"]);
  });
});

describe("claim", () => {
  const started = async () => {
    const prepared = await interactionService.prepare(PERSON, { messageId: MESSAGE, customId: "accept" });
    await interactionService.store(prepared.interaction);
    return prepared;
  };

  it("lets the bot that received it answer once", async () => {
    const { event } = await started();

    await expect(interactionService.claim(BOT, event.id, event.token)).resolves.toMatchObject({ userId: PERSON });
    await expect(interactionService.claim(BOT, event.id, event.token)).rejects.toThrow("already answered");
  });

  it("refuses a wrong token or another bot with the same answer", async () => {
    const { event } = await started();

    await expect(interactionService.claim(BOT, event.id, "wrong")).rejects.toThrow("not found or expired");
    await expect(interactionService.claim(OTHER_BOT, event.id, event.token)).rejects.toThrow("not found or expired");
  });

  it("refuses an answer after the response window", async () => {
    const { event } = await started();
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 10_000);

    await expect(interactionService.claim(BOT, event.id, event.token)).rejects.toThrow("Respond within 3 seconds");

    vi.useRealTimers();
  });

  it("a released claim can be answered again", async () => {
    const { event } = await started();

    await interactionService.claim(BOT, event.id, event.token);
    await interactionService.release(event.id);

    await expect(interactionService.claim(BOT, event.id, event.token)).resolves.toBeTruthy();
  });
});

describe("ephemeral messages", () => {
  const botUser = { id: BOT, username: "shop", displayName: "Shop", avatarUrl: null, status: "ONLINE" as const, isBot: true };
  const rows = [{ components: [{ type: "button" as const, style: "danger" as const, label: "Cancel", customId: "cancel" }] }];

  const ephemeral = async () => {
    const { ephemeralService } = await import("~/services/ephemeral-service.js");
    findMessage.mockResolvedValue(null);
    const { message } = await ephemeralService.create({ bot: botUser, userId: PERSON, channelId: CHANNEL, content: "Only you", components: rows });
    return { ephemeralService, message };
  };

  it("only the person who received it can click its components", async () => {
    const { message } = await ephemeral();

    const { interaction } = await interactionService.prepare(PERSON, { messageId: message.id, customId: "cancel" });
    expect(interaction.sourceEphemeral).toBe(true);

    await expect(interactionService.prepare(OTHER_BOT, { messageId: message.id, customId: "cancel" })).rejects.toThrow(
      "Mensagem não encontrada",
    );
  });

  it("an empty ephemeral reply is refused", async () => {
    const { ephemeralService } = await import("~/services/ephemeral-service.js");
    await expect(ephemeralService.create({ bot: botUser, userId: PERSON, channelId: CHANNEL, content: "  " })).rejects.toThrow();
  });

  it("only the bot that sent it can edit it, and swapping components is not an edit", async () => {
    const { ephemeralService, message } = await ephemeral();

    await expect(ephemeralService.edit(message.id, OTHER_BOT, { content: "x" })).rejects.toThrow("expired");

    const { message: updated } = await ephemeralService.edit(message.id, BOT, { components: [] });
    expect(updated.components).toEqual([]);
    expect(updated.editedAt).toBeNull();
    expect(updated.ephemeral).toBe(true);
  });
});
