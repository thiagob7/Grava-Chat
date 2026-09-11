import { describe, expect, it } from "vitest";

import { deviceName } from "~/lib/aparelho";

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
    expect(deviceName(CHROME_MAC)).toBe("Chrome · macOS");
    expect(deviceName(SAFARI_IPHONE)).toBe("Safari · iPhone");
  });

  it("não confunde Edge com Chrome", () => {
    expect(deviceName(EDGE_WIN)).toBe("Edge · Windows");
  });

  it("reconhece o aplicativo de desktop antes do navegador", () => {
    expect(deviceName(APP_MAC)).toBe("Aplicativo · macOS");
  });

  it("não inventa nome quando não sabe", () => {
    expect(deviceName(null)).toBe("Aparelho desconhecido");
    expect(deviceName("curl/8.4.0")).toBe("Aparelho desconhecido");
  });
});
