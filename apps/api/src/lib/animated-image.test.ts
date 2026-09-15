import { describe, expect, it } from "vitest";

import { isAnimatedWebp } from "./animated-image.js";

const bytes = (text: string) => new Uint8Array([...text].map((c) => c.charCodeAt(0)));

describe("imagem animada", () => {
  it("webp com bloco ANIM é animado", () => {
    expect(isAnimatedWebp(bytes("RIFF\0\0\0\0WEBPVP8X\0\0\0\0ANIM\0\0"))).toBe(true);
  });

  it("webp parado não é animado", () => {
    expect(isAnimatedWebp(bytes("RIFF\0\0\0\0WEBPVP8 \0\0\0\0dados"))).toBe(false);
  });

  it("outro formato não é webp", () => {
    expect(isAnimatedWebp(bytes("\x89PNG\r\n\x1a\nANIM"))).toBe(false);
  });
});
