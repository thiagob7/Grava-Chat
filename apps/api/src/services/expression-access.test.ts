import { beforeEach, describe, expect, it, vi } from "vitest";

const USER = "6a8781da7415b08f427be1a4";
const HERE = "6a8781f57415b08f427be1ad";
const ELSEWHERE = "6a8781db7415b08f427be1aa";
const EMOJI_HERE = "6a8781db7415b08f427be1b1";
const EMOJI_ELSEWHERE = "6a8781db7415b08f427be1b2";

let premium = false;
let memberOfElsewhere = true;

vi.mock("~/repositories/expression-repository.js", () => {
  const emojis = [
    { id: EMOJI_HERE, guildId: HERE, name: "aqui", url: "u1", animated: false },
    { id: EMOJI_ELSEWHERE, guildId: ELSEWHERE, name: "fora", url: "u2", animated: true },
  ];

  return {
    expressionRepository: {
      findEmojisByIds: async (ids: string[]) => emojis.filter((e) => ids.includes(e.id)),
      findEmojiById: async (id: string) => emojis.find((e) => e.id === id) ?? null,
    },
  };
});

vi.mock("~/repositories/guild-repository.js", () => ({
  memberRepository: { find: async (guildId: string) => (guildId === ELSEWHERE && !memberOfElsewhere ? null : { id: "m" }) },
}));

vi.mock("~/services/plan-service.js", () => ({
  planService: {
    requireFeature: async (_userId: string, _feature: string, message: string) => {
      if (!premium) throw Object.assign(new Error(message), { reason: "premium" });
    },
  },
}));

const { expressionAccess } = await import("./expression-access.js");

beforeEach(() => {
  premium = false;
  memberOfElsewhere = true;
});

describe("emoji e figurinha de outro servidor", () => {
  it("emoji do próprio servidor passa no grátis", async () => {
    await expressionAccess.requireEmojisInText(USER, HERE, `oi <:aqui:${EMOJI_HERE}>`);
  });

  it("emoji de outro servidor pede o Infinity", async () => {
    await expect(expressionAccess.requireEmojisInText(USER, HERE, `<a:fora:${EMOJI_ELSEWHERE}>`)).rejects.toMatchObject({
      reason: "premium",
    });
  });

  it("no Infinity passa, desde que a pessoa esteja no servidor do emoji", async () => {
    premium = true;
    await expressionAccess.requireEmojisInText(USER, HERE, `<a:fora:${EMOJI_ELSEWHERE}>`);

    memberOfElsewhere = false;
    await expect(expressionAccess.requireEmojisInText(USER, HERE, `<a:fora:${EMOJI_ELSEWHERE}>`)).rejects.toThrow(/precisa estar/);
  });

  it("na conversa privada todo emoji de servidor conta como de fora", async () => {
    await expect(expressionAccess.requireReaction(USER, null, `<:aqui:${EMOJI_HERE}>`)).rejects.toMatchObject({ reason: "premium" });
  });

  it("reação com emoji comum não consulta nada", async () => {
    await expressionAccess.requireReaction(USER, HERE, "👍");
  });

  it("figurinha de outro servidor pede o Infinity", async () => {
    await expressionAccess.requireSticker(USER, HERE, { guildId: HERE });
    await expect(expressionAccess.requireSticker(USER, HERE, { guildId: ELSEWHERE })).rejects.toMatchObject({ reason: "premium" });
  });
});
