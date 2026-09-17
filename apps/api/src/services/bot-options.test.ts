import { beforeEach, describe, expect, it, vi } from "vitest";

const findBot = vi.fn();
const findMember = vi.fn();
const guildRoles = vi.fn();

vi.mock("~/repositories/bot-repository.js", () => ({
  botRepository: { findById: (...a: unknown[]) => findBot(...a) },
}));

vi.mock("~/repositories/guild-repository.js", () => ({
  memberRepository: { find: (...a: unknown[]) => findMember(...a) },
  guildRepository: {},
}));

vi.mock("~/repositories/role-repository.js", () => ({
  roleRepository: { findManyByGuild: (...a: unknown[]) => guildRoles(...a) },
}));

vi.mock("~/repositories/user-repository.js", () => ({ userRepository: {} }));
vi.mock("~/services/access-service.js", () => ({ accessService: {}, requireGrantable: vi.fn() }));
vi.mock("~/services/auth-service.js", () => ({ authService: {} }));

const { botService } = await import("~/services/bot-service.js");

const ROLE = "6a8781db7415b08f427be1ab";
const GUILD = "6a8781db7415b08f427be1aa";
const BOT = "6a8781db7415b08f427be1ac";

const command = {
  name: "order",
  description: "Place an order",
  options: [
    {
      name: "size",
      description: "Size",
      kind: "texto",
      required: true,
      choices: [
        { name: "Small", value: "s" },
        { name: "Large", value: "l" },
      ],
    },
    { name: "amount", description: "Amount", kind: "numero", choices: [{ name: "One", value: 1 }, { name: "Two", value: 2 }] },
    { name: "gift", description: "Is it a gift", kind: "boolean" },
    { name: "team", description: "Team role", kind: "role" },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  findBot.mockResolvedValue({ id: BOT, botUserId: "u-bot", commands: [command] });
  findMember.mockResolvedValue({ roleIds: [] });
  guildRoles.mockResolvedValue([{ id: ROLE }]);
});

const invoke = (options: Record<string, string>) =>
  botService.resolveInvocation({ guildId: GUILD, botId: BOT, command: "order", options });

describe("command options", () => {
  it("a choice matches by name or value and arrives as the value", async () => {
    await expect(invoke({ size: "large", amount: "Two" })).resolves.toMatchObject({ options: { size: "l", amount: 2 } });
    await expect(invoke({ size: "s" })).resolves.toMatchObject({ options: { size: "s" } });
  });

  it("refuses a value outside the choices, listing them", async () => {
    await expect(invoke({ size: "medium" })).rejects.toThrow("Small, Large");
  });

  it("reads yes and no in both languages as booleans", async () => {
    await expect(invoke({ size: "s", gift: "sim" })).resolves.toMatchObject({ options: { gift: true } });
    await expect(invoke({ size: "s", gift: "no" })).resolves.toMatchObject({ options: { gift: false } });
    await expect(invoke({ size: "s", gift: "maybe" })).rejects.toThrow("sim ou não");
  });

  it("a role must belong to the server, as a mention or an id", async () => {
    await expect(invoke({ size: "s", team: `<@&${ROLE}>` })).resolves.toMatchObject({ options: { team: ROLE } });
    await expect(invoke({ size: "s", team: "6a8781db7415b08f427be1ff" })).rejects.toThrow("cargo deste servidor");
  });
});
