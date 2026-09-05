import { describe, expect, it } from "vitest";

import { codigoDoConviteNoLink } from "./convites.js";

const AQUI = "https://gravae-chat.vercel.app";

describe("código do convite no link", () => {
  it("acha o código num link nosso", () => {
    expect(codigoDoConviteNoLink(`${AQUI}/invite/14eYWcO5`, AQUI)).toBe("14eYWcO5");
  });

  it("aceita o link relativo, que é como ele sai do compositor", () => {
    expect(codigoDoConviteNoLink("/invite/abcd1234", AQUI)).toBe("abcd1234");
  });

  /// Convite de outro app é link comum, e vira a prévia de sempre.
  it("ignora link de fora", () => {
    expect(codigoDoConviteNoLink("https://fluxer.gg/44wvtfoy", AQUI)).toBeNull();
    expect(codigoDoConviteNoLink("https://discord.gg/abcd", AQUI)).toBeNull();
  });

  it("ignora outro caminho nosso", () => {
    expect(codigoDoConviteNoLink(`${AQUI}/channels/123`, AQUI)).toBeNull();
    expect(codigoDoConviteNoLink(`${AQUI}/invite/`, AQUI)).toBeNull();
    expect(codigoDoConviteNoLink(`${AQUI}/invite/abc/extra`, AQUI)).toBeNull();
  });

  it("não quebra com lixo", () => {
    expect(codigoDoConviteNoLink("nao é link", AQUI)).toBeNull();
  });
});
