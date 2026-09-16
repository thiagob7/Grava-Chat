import { beforeEach, describe, expect, it, vi } from "vitest";

const BUYER = "6a8781da7415b08f427be1a4";
const FRIEND = "6a8781f57415b08f427be1ad";
const DAY = 24 * 60 * 60 * 1000;

type Gift = { id: string; code: string; interval: string; days: number; amount: number; buyerId: string; sourceId: string; claimedById: string | null; claimedAt: Date | null; createdAt: Date };

let gifts: Gift[];
let users: Record<string, { id: string; displayName: string; avatarUrl: null; premiumUntil: Date | null; premiumSource: string | null }>;
const announced: string[] = [];

vi.mock("~/lib/gift-code.js", () => ({ newGiftCode: () => "ABCD2345EFGH" }));
vi.mock("~/realtime/difusao.js", () => ({ announceUserUpdated: async (u: { id: string }) => void announced.push(u.id) }));

vi.mock("~/repositories/user-repository.js", () => ({
  userRepository: {
    findById: async (id: string) => users[id] ?? null,
    update: async (id: string, data: Partial<(typeof users)[string]>) => (users[id] = { ...users[id]!, ...data }),
  },
}));

vi.mock("~/repositories/billing-repository.js", () => ({
  billingRepository: {
    createGift: async (data: Omit<Gift, "id" | "claimedById" | "claimedAt" | "createdAt">) => {
      const row = { ...data, id: `g${gifts.length + 1}`, claimedById: null, claimedAt: null, createdAt: new Date() };
      gifts.push(row);
      return row;
    },
    giftByCode: async (code: string) => gifts.find((g) => g.code === code) ?? null,
    giftBySource: async (sourceId: string) => gifts.find((g) => g.sourceId === sourceId) ?? null,
    giftsOf: async (buyerId: string) => gifts.filter((g) => g.buyerId === buyerId),
    claimGift: async (id: string, claimedById: string, claimedAt: Date) => {
      const row = gifts.find((g) => g.id === id && !g.claimedAt);
      if (row) Object.assign(row, { claimedById, claimedAt });
      return { count: row ? 1 : 0 };
    },
  },
}));

const { giftService } = await import("./gift-service.js");

const buy = () =>
  giftService.create({ buyerId: BUYER, sourceId: "mpo:1", interval: "month", days: 30, amount: 1800 });

beforeEach(() => {
  gifts = [];
  announced.length = 0;
  users = {
    [BUYER]: { id: BUYER, displayName: "Quem deu", avatarUrl: null, premiumUntil: null, premiumSource: null },
    [FRIEND]: { id: FRIEND, displayName: "Amigo", avatarUrl: null, premiumUntil: null, premiumSource: null },
  };
});

describe("presente do Infinity", () => {
  it("o pagamento gera um código só, mesmo se chegar duas vezes", async () => {
    const first = await buy();
    const again = await buy();

    expect(again.id).toBe(first.id);
    expect(gifts).toHaveLength(1);
    expect((await giftService.mine(BUYER))[0]).toMatchObject({ code: "ABCD-2345-EFGH", days: 30, claimedAt: null });
  });

  it("o amigo resgata e ganha os dias", async () => {
    await buy();
    const view = await giftService.claim(FRIEND, "ABCD2345EFGH");

    expect(users[FRIEND]!.premiumUntil!.getTime()).toBeGreaterThan(Date.now() + 29 * DAY);
    expect(users[FRIEND]!.premiumSource).toBe("gift");
    expect(view.claimedBy).toMatchObject({ id: FRIEND, displayName: "Amigo" });
    expect(announced).toEqual([FRIEND]);
  });

  it("o mesmo código não vale duas vezes", async () => {
    await buy();
    await giftService.claim(FRIEND, "ABCD2345EFGH");

    await expect(giftService.claim(BUYER, "ABCD2345EFGH")).rejects.toThrow(/já foi resgatado/);
    expect(users[BUYER]!.premiumUntil).toBeNull();
  });

  it("código que não existe dá erro", async () => {
    await expect(giftService.claim(FRIEND, "ZZZZ9999ZZZZ")).rejects.toThrow(/não encontrado/);
  });
});
