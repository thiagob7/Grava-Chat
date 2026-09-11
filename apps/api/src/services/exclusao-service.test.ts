import { beforeEach, describe, expect, it, vi } from "vitest";

const accountsExpired = vi.fn();
const accountServers = vi.fn();
const transaction = vi.fn();

vi.mock("~/lib/prisma.js", () => ({
  prisma: {
    user: { findMany: (...a: unknown[]) => accountsExpired(...a), delete: vi.fn() },
    guild: { findMany: (...a: unknown[]) => accountServers(...a), deleteMany: vi.fn() },
    webhook: { deleteMany: vi.fn() },
    $transaction: (...a: unknown[]) => transaction(...a),
  },
}));

const { deletionService } = await import("~/services/exclusao-service.js");

const account = (id: string, username = id) => ({ id, username });
const server = (name: string, members: number) => ({
  id: `g-${name}`,
  name: name,
  _count: { members: members },
});

beforeEach(() => {
  vi.clearAllMocks();
  transaction.mockResolvedValue([]);
});

describe("purga das contas vencidas", () => {
  it("não faz nada quando ninguém venceu", async () => {
    accountsExpired.mockResolvedValue([]);

    expect(await deletionService.purgeExpired()).toEqual({ deleted: 0, delayed: 0 });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("apaga quem não é dono de servidor nenhum", async () => {
    accountsExpired.mockResolvedValue([account("1")]);
    accountServers.mockResolvedValue([]);

    expect(await deletionService.purgeExpired()).toEqual({ deleted: 1, delayed: 0 });
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it("apaga junto o servidor em que ela é a única pessoa", async () => {
    accountsExpired.mockResolvedValue([account("1")]);
    accountServers.mockResolvedValue([server("Só eu", 1)]);

    expect(await deletionService.purgeExpired()).toEqual({ deleted: 1, delayed: 0 });
  });

  it("ADIA quando o servidor dela ganhou gente durante os quinze dias", async () => {
    accountsExpired.mockResolvedValue([account("1")]);
    accountServers.mockResolvedValue([server("Encheu", 4)]);

    expect(await deletionService.purgeExpired()).toEqual({ deleted: 0, delayed: 1 });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("uma conta que falha não leva as outras junto", async () => {
    accountsExpired.mockResolvedValue([account("1"), account("2"), account("3")]);
    accountServers.mockResolvedValue([]);
    transaction
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error("relação nova sem cascade"))
      .mockResolvedValueOnce([]);

    expect(await deletionService.purgeExpired()).toEqual({ deleted: 2, delayed: 1 });
    expect(transaction).toHaveBeenCalledTimes(3);
  });

  it("só olha para contas com prazo já vencido", async () => {
    accountsExpired.mockResolvedValue([]);
    await deletionService.purgeExpired();

    const [{ where }] = accountsExpired.mock.calls[0] as [{ where: { deleteAt: { lte: Date } } }];

    expect(where.deleteAt.lte).toBeInstanceOf(Date);
    expect(where.deleteAt.lte.getTime()).toBeLessThanOrEqual(Date.now());
  });
});
