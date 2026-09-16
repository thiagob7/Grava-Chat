import { describe, expect, it } from "vitest";

import { giftCodeInLink } from "./gift-link";

describe("link de presente", () => {
  it("lê o código do link, com ou sem traços", () => {
    expect(giftCodeInLink("https://gravae.io/channels/@me?gift=NZMMMD6Y6WHR")).toBe("NZMMMD6Y6WHR");
    expect(giftCodeInLink("  https://gravae.io/channels/@me?gift=nzmm-md6y-6whr  ")).toBe("NZMMMD6Y6WHR");
  });

  it("lê o código do endereço novo, com a página de resgate", () => {
    expect(giftCodeInLink("https://gravae.io/gift/NZMMMD6Y6WHR")).toBe("NZMMMD6Y6WHR");
    expect(giftCodeInLink("https://gravae.io/gift/NZMM-MD6Y-6WHR")).toBe("NZMMMD6Y6WHR");
  });

  it("ignora o que não é só um link de presente", () => {
    expect(giftCodeInLink("olha isso https://gravae.io/channels/@me?gift=NZMMMD6Y6WHR")).toBeNull();
    expect(giftCodeInLink("https://gravae.io/channels/@me")).toBeNull();
    expect(giftCodeInLink("https://gravae.io/channels/@me?gift=CURTO")).toBeNull();
    expect(giftCodeInLink("nem link")).toBeNull();
  });
});
