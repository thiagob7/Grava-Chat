import { describe, expect, it } from "vitest";

import { inviteLinkCode } from "./convites.js";
import { APP_ORIGINS } from "./origens.js";

const HERE = "https://gravae-chat.vercel.app";

describe("código do convite no link", () => {
  it("acha o código num link nosso", () => {
    expect(inviteLinkCode(`${HERE}/invite/14eYWcO5`, HERE)).toBe("14eYWcO5");
  });

  it("aceita o link relativo, que é como ele sai do compositor", () => {
    expect(inviteLinkCode("/invite/abcd1234", HERE)).toBe("abcd1234");
  });

  it("acha o código num link copiado de outro ambiente nosso", () => {
    const link = "https://gravae-chat.vercel.app/invite/ASan_PxE";

    expect(inviteLinkCode(link, "http://localhost:5173")).toBeNull();
    expect(
      inviteLinkCode(link, ["http://localhost:5173", ...APP_ORIGINS]),
    ).toBe("ASan_PxE");
  });

  it("ignora link de fora", () => {
    expect(inviteLinkCode("https://referencia.gg/44wvtfoy", HERE)).toBeNull();
    expect(inviteLinkCode("https://discord.gg/abcd", HERE)).toBeNull();
  });

  it("ignora outro caminho nosso", () => {
    expect(inviteLinkCode(`${HERE}/channels/123`, HERE)).toBeNull();
    expect(inviteLinkCode(`${HERE}/invite/`, HERE)).toBeNull();
    expect(inviteLinkCode(`${HERE}/invite/abc/extra`, HERE)).toBeNull();
  });

  it("não quebra com lixo", () => {
    expect(inviteLinkCode("nao é link", HERE)).toBeNull();
  });
});
