import { beforeEach, describe, expect, it, vi } from "vitest";

const findUser = vi.fn();
const createMember = vi.fn();

vi.mock("~/lib/prisma.js", () => ({
  prisma: {
    user: { findUnique: (...a: unknown[]) => findUser(...a) },
    guildMember: { create: (...a: unknown[]) => createMember(...a) },
  },
}));

const { memberRepository } = await import("~/repositories/guild-repository.js");

const GUILD = "6a8781db7415b08f427be1aa";
const HOUSE = "6a8781da7415b08f427be1a4";
const FOLKS = "6a8781f57415b08f427be1ad";

describe("conta oficial", () => {
  beforeEach(() => {
    findUser.mockReset();
    createMember.mockReset();
  });

  it("não entra em servidor", async () => {
    findUser.mockResolvedValue({ system: true });

    await expect(
      memberRepository.create({ guildId: GUILD, userId: HOUSE }),
    ).rejects.toThrow(/não entra em servidor/);

    expect(createMember).not.toHaveBeenCalled();
  });

  it("não atrapalha quem é gente", async () => {
    findUser.mockResolvedValue({ system: false });
    createMember.mockResolvedValue({ id: "m1" });

    await memberRepository.create({ guildId: GUILD, userId: FOLKS });

    expect(createMember).toHaveBeenCalled();
  });
});
