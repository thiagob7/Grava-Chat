import { describe, expect, it, vi } from "vitest";

const candidatas = vi.fn();
const membrosDe = vi.fn();
const acharMembro = vi.fn();
const criarMembro = vi.fn();
const acharBanimento = vi.fn();
const mapFor = vi.fn();

vi.mock("~/repositories/guild-repository.js", () => ({
  descobertaRepository: {
    candidatas: (...args: unknown[]) => candidatas(...args),
    membrosDe: (...args: unknown[]) => membrosDe(...args),
  },
  memberRepository: {
    find: (...args: unknown[]) => acharMembro(...args),
    create: (...args: unknown[]) => criarMembro(...args),
  },
}));

vi.mock("~/repositories/ban-repository.js", () => ({
  banRepository: { find: (...args: unknown[]) => acharBanimento(...args) },
}));

vi.mock("~/services/presence-service.js", () => ({
  presenceService: { mapFor: (...args: unknown[]) => mapFor(...args) },
}));

vi.mock("~/lib/serialize.js", () => ({ toMember: (m: unknown) => m }));

const { descobertaService } = await import("~/services/descoberta-service.js");

const servidor = (id: string, membros: number, extras = {}) => ({
  id,
  name: `Servidor ${id}`,
  iconUrl: null,
  bannerUrl: null,
  description: null,
  categoria: null,
  _count: { members: membros },
  ...extras,
});

describe("listar comunidades", () => {
  it("deixa de fora quem nao chegou aos cem membros", async () => {
    candidatas.mockResolvedValue([servidor("a", 99), servidor("b", 100)]);
    membrosDe.mockResolvedValue(new Map([["b", ["u1"]]]));
    mapFor.mockResolvedValue({ u1: "ONLINE" });

    const lista = await descobertaService.listar("eu", {});

    expect(lista.map((c) => c.id)).toEqual(["b"]);
  });

  it("conta como online so quem nao esta offline", async () => {
    candidatas.mockResolvedValue([servidor("a", 100)]);
    membrosDe.mockResolvedValue(new Map([["a", ["u1", "u2", "u3"]]]));
    mapFor.mockResolvedValue({ u1: "ONLINE", u2: "OFFLINE", u3: "DND" });

    const lista = await descobertaService.listar("eu", {});

    expect(lista[0]?.online).toBe(2);
    expect(lista[0]?.membros).toBe(100);
  });

  it("marca onde eu ja estou dentro", async () => {
    candidatas.mockResolvedValue([servidor("a", 100), servidor("b", 200)]);
    membrosDe.mockResolvedValue(
      new Map([
        ["a", ["eu"]],
        ["b", ["outro"]],
      ]),
    );
    mapFor.mockResolvedValue({});

    const lista = await descobertaService.listar("eu", {});

    expect(lista.find((c) => c.id === "a")?.jaSouMembro).toBe(true);
    expect(lista.find((c) => c.id === "b")?.jaSouMembro).toBe(false);
  });

  it("poe as maiores primeiro", async () => {
    candidatas.mockResolvedValue([servidor("a", 100), servidor("b", 900), servidor("c", 300)]);
    membrosDe.mockResolvedValue(new Map());
    mapFor.mockResolvedValue({});

    const lista = await descobertaService.listar("eu", {});

    expect(lista.map((c) => c.id)).toEqual(["b", "c", "a"]);
  });

  it("ignora categoria que nao existe em vez de nao achar nada", async () => {
    candidatas.mockResolvedValue([servidor("a", 100)]);
    membrosDe.mockResolvedValue(new Map());
    mapFor.mockResolvedValue({});

    await descobertaService.listar("eu", { categoria: "INVENTADA" });

    expect(candidatas).toHaveBeenCalledWith(null, null);
  });
});

describe("entrar pela descoberta", () => {
  it("recusa servidor que nao esta na lista", async () => {
    candidatas.mockResolvedValue([servidor("a", 99)]);

    await expect(descobertaService.entrar("eu", "a")).rejects.toThrow(
      "Esta comunidade não está no Explorar",
    );
  });

  it("recusa quem esta banido", async () => {
    candidatas.mockResolvedValue([servidor("a", 100)]);
    acharBanimento.mockResolvedValue({ id: "ban" });

    await expect(descobertaService.entrar("eu", "a")).rejects.toThrow("banido");
  });

  it("nao cria membro de novo pra quem ja esta dentro", async () => {
    candidatas.mockResolvedValue([servidor("a", 100)]);
    acharBanimento.mockResolvedValue(null);
    acharMembro.mockResolvedValue({ id: "m1" });

    const resultado = await descobertaService.entrar("eu", "a");

    expect(resultado.jaEraMembro).toBe(true);
    expect(criarMembro).not.toHaveBeenCalled();
  });

  it("entra sem convite nenhum", async () => {
    candidatas.mockResolvedValue([servidor("a", 100)]);
    acharBanimento.mockResolvedValue(null);
    acharMembro.mockResolvedValue(null);
    criarMembro.mockResolvedValue({ id: "m2" });

    const resultado = await descobertaService.entrar("eu", "a");

    expect(resultado.jaEraMembro).toBe(false);
    expect(criarMembro).toHaveBeenCalledWith({ guildId: "a", userId: "eu" });
  });
});
