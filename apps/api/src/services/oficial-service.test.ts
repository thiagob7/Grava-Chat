import { beforeEach, describe, expect, it, vi } from "vitest";

const reserve = vi.fn();
const notify = vi.fn();

vi.mock("~/lib/redis.js", () => ({
  redis: { set: (...a: unknown[]) => reserve(...a) },
  keys: { officialNotice: (key: string) => `oficial:aviso:${key}` },
}));

vi.mock("~/services/sistema-service.js", () => ({
  systemService: { notify: (...a: unknown[]) => notify(...a) },
}));

const { officialService } = await import("~/services/oficial-service.js");

const FOLKS = "6a8781f57415b08f427be1ad";

describe("aviso oficial", () => {
  beforeEach(() => {
    reserve.mockReset();
    notify.mockReset();
  });

  it("manda uma vez e cala na repetição", async () => {
    reserve.mockResolvedValueOnce("OK").mockResolvedValueOnce(null);

    expect(await officialService.notify(FOLKS, "passwordSwapped", undefined)).toBe(true);
    expect(await officialService.notify(FOLKS, "passwordSwapped", undefined)).toBe(false);

    expect(notify).toHaveBeenCalledTimes(1);
  });

  it("escreve título, corpo, ação e o recado de segurança", async () => {
    reserve.mockResolvedValue("OK");

    await officialService.notify(FOLKS, "themePublished", { name: "Meteoro", themeId: "t1" });

    const text = notify.mock.calls[0]![1] as string;

    expect(text).toContain("Tema publicado");
    expect(text).toContain("Meteoro");
    expect(text).toContain("Ver o tema");
    expect(text).toContain("nunca pede a sua senha");
  });

  it("separa a chave por evento, então dois avisos diferentes passam", async () => {
    reserve.mockResolvedValue("OK");

    await officialService.notify(FOLKS, "verifiedCommunity", { name: "Casa" }, { key: "a" });
    await officialService.notify(FOLKS, "communityWithoutSeal", { name: "Casa" }, { key: "b" });

    expect(reserve.mock.calls[0]![0]).not.toBe(reserve.mock.calls[1]![0]);
    expect(notify).toHaveBeenCalledTimes(2);
  });
});
