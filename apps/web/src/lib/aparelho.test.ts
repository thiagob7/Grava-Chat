import { describe, expect, it } from "vitest";

import { nomeDoAparelho } from "~/lib/aparelho";

const CHROME_MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const EDGE_WIN =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0";
const SAFARI_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const APP_MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) gravae-chat/0.2.3 Chrome/130.0.0.0 Electron/33.0.0 Safari/537.36";

describe("nome do aparelho", () => {
  it("lê navegador e sistema", () => {
    expect(nomeDoAparelho(CHROME_MAC)).toBe("Chrome · macOS");
    expect(nomeDoAparelho(SAFARI_IPHONE)).toBe("Safari · iPhone");
  });

  it("não confunde Edge com Chrome", () => {
    expect(nomeDoAparelho(EDGE_WIN)).toBe("Edge · Windows");
  });

  it("reconhece o aplicativo de desktop antes do navegador", () => {
    expect(nomeDoAparelho(APP_MAC)).toBe("Aplicativo · macOS");
  });

  it("não inventa nome quando não sabe", () => {
    expect(nomeDoAparelho(null)).toBe("Aparelho desconhecido");
    expect(nomeDoAparelho("curl/8.4.0")).toBe("Aparelho desconhecido");
  });
});
