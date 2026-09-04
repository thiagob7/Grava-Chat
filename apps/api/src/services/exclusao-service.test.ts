import { beforeEach, describe, expect, it, vi } from "vitest";

const contasVencidas = vi.fn();
const servidoresDaConta = vi.fn();
const transacao = vi.fn();

vi.mock("~/lib/prisma.js", () => ({
  prisma: {
    user: { findMany: (...a: unknown[]) => contasVencidas(...a), delete: vi.fn() },
    guild: { findMany: (...a: unknown[]) => servidoresDaConta(...a), deleteMany: vi.fn() },
    webhook: { deleteMany: vi.fn() },
    $transaction: (...a: unknown[]) => transacao(...a),
  },
}));

const { exclusaoService } = await import("~/services/exclusao-service.js");

const conta = (id: string, username = id) => ({ id, username });
const servidor = (nome: string, membros: number) => ({
  id: `g-${nome}`,
  name: nome,
  _count: { members: membros },
});

beforeEach(() => {
  vi.clearAllMocks();
  transacao.mockResolvedValue([]);
});

describe("purga das contas vencidas", () => {
  it("não faz nada quando ninguém venceu", async () => {
    contasVencidas.mockResolvedValue([]);

    expect(await exclusaoService.purgarVencidas()).toEqual({ apagadas: 0, adiadas: 0 });
    expect(transacao).not.toHaveBeenCalled();
  });

  it("apaga quem não é dono de servidor nenhum", async () => {
    contasVencidas.mockResolvedValue([conta("1")]);
    servidoresDaConta.mockResolvedValue([]);

    expect(await exclusaoService.purgarVencidas()).toEqual({ apagadas: 1, adiadas: 0 });
    expect(transacao).toHaveBeenCalledTimes(1);
  });

  it("apaga junto o servidor em que ela é a única pessoa", async () => {
    contasVencidas.mockResolvedValue([conta("1")]);
    servidoresDaConta.mockResolvedValue([servidor("Só eu", 1)]);

    expect(await exclusaoService.purgarVencidas()).toEqual({ apagadas: 1, adiadas: 0 });
  });

  it("ADIA quando o servidor dela ganhou gente durante os quinze dias", async () => {
    contasVencidas.mockResolvedValue([conta("1")]);
    servidoresDaConta.mockResolvedValue([servidor("Encheu", 4)]);

    expect(await exclusaoService.purgarVencidas()).toEqual({ apagadas: 0, adiadas: 1 });
    expect(transacao).not.toHaveBeenCalled();
  });

  it("uma conta que falha não leva as outras junto", async () => {
    contasVencidas.mockResolvedValue([conta("1"), conta("2"), conta("3")]);
    servidoresDaConta.mockResolvedValue([]);
    transacao
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error("relação nova sem cascade"))
      .mockResolvedValueOnce([]);

    expect(await exclusaoService.purgarVencidas()).toEqual({ apagadas: 2, adiadas: 1 });
    expect(transacao).toHaveBeenCalledTimes(3);
  });

  it("só olha para contas com prazo já vencido", async () => {
    contasVencidas.mockResolvedValue([]);
    await exclusaoService.purgarVencidas();

    const [{ where }] = contasVencidas.mock.calls[0] as [{ where: { excluirEm: { lte: Date } } }];

    expect(where.excluirEm.lte).toBeInstanceOf(Date);
    expect(where.excluirEm.lte.getTime()).toBeLessThanOrEqual(Date.now());
  });
});
