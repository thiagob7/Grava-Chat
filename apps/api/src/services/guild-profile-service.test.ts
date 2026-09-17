import { beforeEach, describe, expect, it, vi } from "vitest";

const USER = "6a8781da7415b08f427be1a4";
const GUILD = "6a8781f57415b08f427be1ad";
const URL = "http://127.0.0.1:1/gravae-chat/a.png";

let premium = false;
let member: Record<string, unknown> | null;
const saved: Record<string, unknown>[] = [];

vi.mock("~/lib/serialize.js", () => ({ toMember: (m: unknown) => m }));
vi.mock("~/repositories/guild-repository.js", () => ({
  memberRepository: {
    find: async () => member,
    setGuildProfile: async (_g: string, _u: string, data: Record<string, unknown>) => {
      saved.push(data);
      return { ...member, ...data };
    },
  },
}));
vi.mock("~/services/plan-service.js", () => ({
  planService: {
    requireFeature: async (_u: string, _f: string, message: string) => {
      if (!premium) throw Object.assign(new Error(message), { reason: "premium" });
    },
  },
}));

const { guildProfileService } = await import("./guild-profile-service.js");

beforeEach(() => {
  premium = false;
  member = { id: "m1", guildId: GUILD };
  saved.length = 0;
});

describe("perfil por comunidade", () => {
  it("no grátis não dá para colocar foto, faixa ou bio", async () => {
    await expect(guildProfileService.update(USER, GUILD, { avatarUrl: URL })).rejects.toMatchObject({ reason: "premium" });
    expect(saved).toHaveLength(0);
  });

  it("no grátis dá para limpar o que ficou de quando era Infinity", async () => {
    await guildProfileService.update(USER, GUILD, { avatarUrl: null, bio: null });
    expect(saved).toEqual([{ avatarUrl: null, bio: null }]);
  });

  it("no Infinity salva, e bio só com espaço vira vazia", async () => {
    premium = true;
    await guildProfileService.update(USER, GUILD, { bannerUrl: URL, bio: "   " });
    expect(saved).toEqual([{ bannerUrl: URL, bio: null }]);
  });

  it("quem não está no servidor não edita", async () => {
    member = null;
    premium = true;
    await expect(guildProfileService.update(USER, GUILD, { bio: "oi" })).rejects.toThrow(/não está/);
  });
});
