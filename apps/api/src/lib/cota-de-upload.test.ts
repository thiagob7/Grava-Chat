import { describe, expect, it } from "vitest";

import { fitsQuota, quotaMessage, QUOTA_BY_HOUR } from "./cota-de-upload.js";

const MB = 1024 * 1024;

describe("cabeNaCota", () => {
  it("quem não enviou nada envia", () => {
    expect(fitsQuota({ alreadyUsed: 0, size: 50 * MB })).toBe(true);
  });

  it("um dia inteiro de fotos comprimidas passa longe do teto", () => {
    expect(fitsQuota({ alreadyUsed: 100 * MB, size: 700 * 1024 })).toBe(true);
  });

  it("barra o arquivo que estouraria a cota", () => {
    expect(fitsQuota({ alreadyUsed: 480 * MB, size: 50 * MB })).toBe(false);
  });

  it("encaixar exatamente na cota ainda passa", () => {
    expect(fitsQuota({ alreadyUsed: QUOTA_BY_HOUR - MB, size: MB })).toBe(true);
  });

  it("um byte além já não passa", () => {
    expect(fitsQuota({ alreadyUsed: QUOTA_BY_HOUR, size: 1 })).toBe(false);
  });

  it("a rajada de vídeos que o limite por requisição deixava passar é barrada", () => {
    let used = 0;
    let accepted = 0;

    for (let i = 0; i < 60; i++) {
      if (!fitsQuota({ alreadyUsed: used, size: 50 * MB })) break;
      used += 50 * MB;
      accepted++;
    }

    expect(accepted).toBe(10);
    expect(used).toBeLessThanOrEqual(QUOTA_BY_HOUR);
  });
});

describe("mensagemDeCota", () => {
  it("diz quanto falta, pra dar o que decidir", () => {
    const text = quotaMessage({ alreadyUsed: 500 * MB });

    expect(text).toContain("500 MB");
    expect(text).toContain("restam 0 MB");
  });

  it("nunca anuncia sobra negativa", () => {
    expect(quotaMessage({ alreadyUsed: 900 * MB })).toContain("restam 0 MB");
  });
});
