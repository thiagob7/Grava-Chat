import { describe, expect, it } from "vitest";

import { customEmojiIds, customEmojiToken, parseCustomEmoji } from "./emoji-token.js";

const ID = "6a8781da7415b08f427be1a4";

describe("emoji de servidor na mensagem", () => {
  it("monta e lê o código, parado ou animado", () => {
    expect(customEmojiToken({ id: ID, name: "gato", animated: false })).toBe(`<:gato:${ID}>`);
    expect(parseCustomEmoji(`<a:gato:${ID}>`)).toEqual({ id: ID, name: "gato", animated: true });
  });

  it("junta os ids sem repetir e ignora o que não é código", () => {
    const text = `oi <:gato:${ID}> e <:gato:${ID}> :sorriso: <@${ID}>`;
    expect(customEmojiIds(text)).toEqual([ID]);
  });

  it("texto que só parece código não passa", () => {
    expect(parseCustomEmoji(`<:g:${ID}>`)).toBeNull();
    expect(parseCustomEmoji(`x<:gato:${ID}>`)).toBeNull();
  });
});
