import { beforeEach, describe, expect, it, vi } from "vitest";

const findBetween = vi.fn();
const guildIdsInCommon = vi.fn();
const friendIdsInCommon = vi.fn();
const findById = vi.fn();
const findManyByIds = vi.fn();
const guildsByIds = vi.fn();

vi.mock("~/repositories/friendship-repository.js", () => ({
  friendshipRepository: { findBetween: (...a: unknown[]) => findBetween(...a) },
  mutualRepository: {
    guildIdsInCommon: (...a: unknown[]) => guildIdsInCommon(...a),
    friendIdsInCommon: (...a: unknown[]) => friendIdsInCommon(...a),
  },
}));

vi.mock("~/repositories/user-repository.js", () => ({
  userRepository: {
    findById: (...a: unknown[]) => findById(...a),
    findManyByIds: (...a: unknown[]) => findManyByIds(...a),
  },
  noteRepository: { upsert: vi.fn() },
}));

vi.mock("~/repositories/guild-repository.js", () => ({
  guildRepository: { findManyByIds: (...a: unknown[]) => guildsByIds(...a) },
  tagRepository: {},
}));

vi.mock("~/services/presence-service.js", () => ({
  presenceService: { mapFor: async () => ({}) },
}));

const { profileService } = await import("~/services/profile-service.js");

const dono = (mostraServidores: boolean, mostraAmigos: boolean) => ({
  id: "dono",
  username: "dono",
  displayName: "Dono",
  avatarUrl: null,
  status: "ONLINE",
  isBot: false,
  mostraServidoresEmComum: mostraServidores,
  mostraAmigosEmComum: mostraAmigos,
});

beforeEach(() => {
  vi.clearAllMocks();
  /// Há servidor em comum, então o perfil é visível — a visibilidade do perfil
  /// e a das abas são portas diferentes, e esta está aberta.
  findBetween.mockResolvedValue(null);
  guildIdsInCommon.mockResolvedValue(["g1"]);
  friendIdsInCommon.mockResolvedValue(["a1"]);
  findManyByIds.mockResolvedValue([]);
  guildsByIds.mockResolvedValue([]);
});

describe("abas de em comum", () => {
  it("entrega as duas listas quando o dono do perfil deixa", async () => {
    findById.mockResolvedValue(dono(true, true));

    await profileService.emComum("quem-olha", "dono");

    expect(friendIdsInCommon).toHaveBeenCalled();
    expect(guildsByIds).toHaveBeenCalledWith(["g1"]);
  });

  /*
    Esconder tem que acontecer ANTES da resposta sair. Devolver a lista e pedir
    para o cliente não desenhar entrega tudo a quem olha a rede — foi o mesmo
    erro do bloqueio aparecendo dos dois lados.
  */
  it("nem busca os amigos em comum quando o dono escondeu", async () => {
    findById.mockResolvedValue(dono(true, false));

    const saida = await profileService.emComum("quem-olha", "dono");

    expect(friendIdsInCommon).not.toHaveBeenCalled();
    expect(saida.amigos).toEqual([]);
  });

  it("nem busca os servidores em comum quando o dono escondeu", async () => {
    findById.mockResolvedValue(dono(false, true));

    const saida = await profileService.emComum("quem-olha", "dono");

    expect(guildsByIds).toHaveBeenCalledWith([]);
    expect(saida.servidores).toEqual([]);
  });

  /// Os dois interruptores são independentes: fechar a rotina não fecha a rede.
  it("fecha uma sem fechar a outra", async () => {
    findById.mockResolvedValue(dono(false, true));

    await profileService.emComum("quem-olha", "dono");

    expect(friendIdsInCommon).toHaveBeenCalled();
    expect(guildsByIds).toHaveBeenCalledWith([]);
  });
});
