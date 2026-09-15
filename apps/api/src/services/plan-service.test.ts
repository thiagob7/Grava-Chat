import { beforeEach, describe, expect, it, vi } from "vitest";
import { PLAN_LIMITS } from "@gravae/shared";

const FREE = "6a8781da7415b08f427be1a4";
const PAYING = "6a8781f57415b08f427be1ad";
const BOT = "6a8781db7415b08f427be1bb";
const DAY = 24 * 60 * 60 * 1000;

const users = new Map<string, { id: string; premiumUntil: Date | null; premiumSource: string | null }>();
const lookups: string[] = [];

vi.mock("~/repositories/user-repository.js", () => ({
  userRepository: {
    planInfoOf: async (id: string) => {
      lookups.push(id);
      const user = users.get(id);
      return user ? { premiumUntil: user.premiumUntil, isBot: user.id === BOT } : null;
    },
    findById: async (id: string) => users.get(id) ?? null,
    update: async (id: string, data: { premiumUntil: Date | null; premiumSource: string | null }) => {
      const row = { ...users.get(id)!, ...data };
      users.set(id, row);
      return row;
    },
  },
}));

const { planService } = await import("~/services/plan-service.js");

beforeEach(() => {
  users.clear();
  lookups.length = 0;
  users.set(FREE, { id: FREE, premiumUntil: null, premiumSource: null });
  users.set(BOT, { id: BOT, premiumUntil: null, premiumSource: null });
  users.set(PAYING, { id: PAYING, premiumUntil: new Date(Date.now() + 10 * DAY), premiumSource: "grant" });
});

describe("limite de mensagem por plano", () => {
  const long = "a".repeat(PLAN_LIMITS.free.messageLength + 1);

  it("mensagem dentro do grátis passa sem consultar a conta", async () => {
    await planService.requireMessageLength(FREE, "a".repeat(PLAN_LIMITS.free.messageLength));
    expect(lookups).toEqual([]);
  });

  it("acima do grátis, a conta grátis é barrada", async () => {
    await expect(planService.requireMessageLength(FREE, long)).rejects.toThrow(/caracteres/);
  });

  it("acima do grátis, a conta premium passa até o teto dela", async () => {
    await planService.requireMessageLength(PAYING, long);

    const tooLong = "a".repeat(PLAN_LIMITS.premium.messageLength + 1);
    await expect(planService.requireMessageLength(PAYING, tooLong)).rejects.toThrow(/caracteres/);
  });

  it("bot segue com o limite da API de bots, sem depender de plano", async () => {
    await planService.requireMessageLength(BOT, long);
  });

  it("premium vencido volta a ter o limite do grátis", async () => {
    users.set(PAYING, { id: PAYING, premiumUntil: new Date(Date.now() - DAY), premiumSource: "grant" });
    await expect(planService.requireMessageLength(PAYING, long)).rejects.toThrow(/caracteres/);
  });
});

describe("anexo e cota por plano", () => {
  const big = PLAN_LIMITS.free.attachmentBytes + 1;

  it("anexo grande só passa para quem é premium", async () => {
    await expect(planService.requireAttachmentSize(FREE, big)).rejects.toThrow(/MB/);
    await planService.requireAttachmentSize(PAYING, big);
  });

  it("a cota só é consultada quando passaria da cota grátis", async () => {
    expect(await planService.uploadQuotaOf(FREE, 10)).toBe(PLAN_LIMITS.free.uploadQuotaByHour);
    expect(lookups).toEqual([]);

    expect(await planService.uploadQuotaOf(PAYING, PLAN_LIMITS.free.uploadQuotaByHour + 1)).toBe(
      PLAN_LIMITS.premium.uploadQuotaByHour,
    );
  });
});

describe("dar e tirar premium", () => {
  it("dar dias soma ao que a conta já tinha", async () => {
    const before = users.get(PAYING)!.premiumUntil!.getTime();
    const user = await planService.grant(PAYING, 30, "grant");

    expect(user.premiumUntil!.getTime()).toBe(before + 30 * DAY);
  });

  it("tirar limpa a data e a origem", async () => {
    const user = await planService.revoke(PAYING);

    expect(user.premiumUntil).toBeNull();
    expect(user.premiumSource).toBeNull();
  });

  it("conta que não existe dá erro", async () => {
    await expect(planService.grant("6a8781db7415b08f427be1aa", 7, "grant")).rejects.toThrow(/não encontrada/);
  });
});
