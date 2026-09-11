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

const owner = (showsServers: boolean, showsFriends: boolean) => ({
  id: "dono",
  username: "dono",
  displayName: "Dono",
  avatarUrl: null,
  status: "ONLINE",
  isBot: false,
  showsServersCommon: showsServers,
  showsFriendsCommon: showsFriends,
});

beforeEach(() => {
  vi.clearAllMocks();
  findBetween.mockResolvedValue(null);
  guildIdsInCommon.mockResolvedValue(["g1"]);
  friendIdsInCommon.mockResolvedValue(["a1"]);
  findManyByIds.mockResolvedValue([]);
  guildsByIds.mockResolvedValue([]);
});

describe("abas de em comum", () => {
  it("entrega as duas listas quando o dono do perfil deixa", async () => {
    findById.mockResolvedValue(owner(true, true));

    await profileService.inCommon("quem-olha", "dono");

    expect(friendIdsInCommon).toHaveBeenCalled();
    expect(guildsByIds).toHaveBeenCalledWith(["g1"]);
  });

  it("nem busca os amigos em comum quando o dono escondeu", async () => {
    findById.mockResolvedValue(owner(true, false));

    const output = await profileService.inCommon("quem-olha", "dono");

    expect(friendIdsInCommon).not.toHaveBeenCalled();
    expect(output.friends).toEqual([]);
  });

  it("nem busca os servidores em comum quando o dono escondeu", async () => {
    findById.mockResolvedValue(owner(false, true));

    const output = await profileService.inCommon("quem-olha", "dono");

    expect(guildsByIds).toHaveBeenCalledWith([]);
    expect(output.servers).toEqual([]);
  });

  it("fecha uma sem fechar a outra", async () => {
    findById.mockResolvedValue(owner(false, true));

    await profileService.inCommon("quem-olha", "dono");

    expect(friendIdsInCommon).toHaveBeenCalled();
    expect(guildsByIds).toHaveBeenCalledWith([]);
  });
});
