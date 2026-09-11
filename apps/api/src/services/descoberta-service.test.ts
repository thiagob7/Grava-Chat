import { describe, expect, it, vi } from "vitest";

const candidates = vi.fn();
const members = vi.fn();
const findMember = vi.fn();
const createMember = vi.fn();
const findBan = vi.fn();
const mapFor = vi.fn();

vi.mock("~/repositories/guild-repository.js", () => ({
  discoveryRepository: {
    candidates: (...args: unknown[]) => candidates(...args),
    members: (...args: unknown[]) => members(...args),
  },
  memberRepository: {
    find: (...args: unknown[]) => findMember(...args),
    create: (...args: unknown[]) => createMember(...args),
  },
}));

vi.mock("~/repositories/ban-repository.js", () => ({
  banRepository: { find: (...args: unknown[]) => findBan(...args) },
}));

vi.mock("~/services/presence-service.js", () => ({
  presenceService: { mapFor: (...args: unknown[]) => mapFor(...args) },
}));

vi.mock("~/lib/serialize.js", () => ({ toMember: (m: unknown) => m }));

const { discoveryService } = await import("~/services/descoberta-service.js");

const server = (id: string, members: number, extras = {}) => ({
  id,
  name: `Servidor ${id}`,
  iconUrl: null,
  bannerUrl: null,
  description: null,
  category: null,
  _count: { members: members },
  ...extras,
});

describe("listar comunidades", () => {
  it("deixa de fora quem nao chegou aos cem membros", async () => {
    candidates.mockResolvedValue([server("a", 99), server("b", 100)]);
    members.mockResolvedValue(new Map([["b", ["u1"]]]));
    mapFor.mockResolvedValue({ u1: "ONLINE" });

    const list = await discoveryService.list("eu", {});

    expect(list.map((c) => c.id)).toEqual(["b"]);
  });

  it("conta como online so quem nao esta offline", async () => {
    candidates.mockResolvedValue([server("a", 100)]);
    members.mockResolvedValue(new Map([["a", ["u1", "u2", "u3"]]]));
    mapFor.mockResolvedValue({ u1: "ONLINE", u2: "OFFLINE", u3: "DND" });

    const list = await discoveryService.list("eu", {});

    expect(list[0]?.online).toBe(2);
    expect(list[0]?.members).toBe(100);
  });

  it("marca onde eu ja estou dentro", async () => {
    candidates.mockResolvedValue([server("a", 100), server("b", 200)]);
    members.mockResolvedValue(
      new Map([
        ["a", ["eu"]],
        ["b", ["outro"]],
      ]),
    );
    mapFor.mockResolvedValue({});

    const list = await discoveryService.list("eu", {});

    expect(list.find((c) => c.id === "a")?.alreadyAmMember).toBe(true);
    expect(list.find((c) => c.id === "b")?.alreadyAmMember).toBe(false);
  });

  it("poe as maiores primeiro", async () => {
    candidates.mockResolvedValue([server("a", 100), server("b", 900), server("c", 300)]);
    members.mockResolvedValue(new Map());
    mapFor.mockResolvedValue({});

    const list = await discoveryService.list("eu", {});

    expect(list.map((c) => c.id)).toEqual(["b", "c", "a"]);
  });

  it("ignora categoria que nao existe em vez de nao achar nada", async () => {
    candidates.mockResolvedValue([server("a", 100)]);
    members.mockResolvedValue(new Map());
    mapFor.mockResolvedValue({});

    await discoveryService.list("eu", { category: "INVENTADA" });

    expect(candidates).toHaveBeenCalledWith(null, null);
  });
});

describe("entrar pela descoberta", () => {
  it("recusa servidor que nao esta na lista", async () => {
    candidates.mockResolvedValue([server("a", 99)]);

    await expect(discoveryService.join("eu", "a")).rejects.toThrow(
      "Esta comunidade não está no Explorar",
    );
  });

  it("recusa quem esta banido", async () => {
    candidates.mockResolvedValue([server("a", 100)]);
    findBan.mockResolvedValue({ id: "ban" });

    await expect(discoveryService.join("eu", "a")).rejects.toThrow("banido");
  });

  it("nao cria membro de novo pra quem ja esta dentro", async () => {
    candidates.mockResolvedValue([server("a", 100)]);
    findBan.mockResolvedValue(null);
    findMember.mockResolvedValue({ id: "m1" });

    const result = await discoveryService.join("eu", "a");

    expect(result.alreadyWasMember).toBe(true);
    expect(createMember).not.toHaveBeenCalled();
  });

  it("entra sem convite nenhum", async () => {
    candidates.mockResolvedValue([server("a", 100)]);
    findBan.mockResolvedValue(null);
    findMember.mockResolvedValue(null);
    createMember.mockResolvedValue({ id: "m2" });

    const result = await discoveryService.join("eu", "a");

    expect(result.alreadyWasMember).toBe(false);
    expect(createMember).toHaveBeenCalledWith({ guildId: "a", userId: "eu" });
  });
});
