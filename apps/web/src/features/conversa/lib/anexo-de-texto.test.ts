import { describe, expect, it } from "vitest";
import type { Attachment } from "@gravae/shared";

import { LARGER_PREVIEW_BYTES, isTextAttachment, extension } from "./anexo-de-texto";

const attachment = (partial: Partial<Attachment>): Attachment => ({
  id: "1",
  url: "https://exemplo/arquivo",
  filename: "arquivo.txt",
  contentType: "text/plain",
  size: 1024,
  ...partial,
});

describe("extensao do arquivo", () => {
  it("pega a ultima, mesmo com ponto no meio", () => {
    expect(extension("FR_QuietSystemGruvbox.min.css")).toBe("css");
  });

  it("devolve vazio quando nao ha ponto", () => {
    expect(extension("Dockerfile")).toBe("");
  });

  it("nao se importa com caixa alta", () => {
    expect(extension("LEIA.MD")).toBe("md");
  });
});

describe("vale previa com realce?", () => {
  it("sim para tipo de texto declarado", () => {
    expect(isTextAttachment(attachment({ contentType: "text/css" }))).toBe(true);
    expect(isTextAttachment(attachment({ contentType: "application/json" }))).toBe(true);
  });

  it("sim quando o tipo vem generico mas o nome entrega", () => {
    expect(
      isTextAttachment(attachment({ contentType: "application/octet-stream", filename: "vite.config.ts" })),
    ).toBe(true);
  });

  it("nao para imagem, video e binario", () => {
    expect(isTextAttachment(attachment({ contentType: "image/png", filename: "foto.png" }))).toBe(false);
    expect(isTextAttachment(attachment({ contentType: "video/mp4", filename: "clipe.mp4" }))).toBe(false);
    expect(
      isTextAttachment(attachment({ contentType: "application/zip", filename: "tudo.zip" })),
    ).toBe(false);
  });

  it("nao baixa arquivo grande so para mostrar sete linhas", () => {
    expect(
      isTextAttachment(attachment({ contentType: "text/plain", size: LARGER_PREVIEW_BYTES + 1 })),
    ).toBe(false);
  });

  it("aceita exatamente no limite", () => {
    expect(isTextAttachment(attachment({ contentType: "text/plain", size: LARGER_PREVIEW_BYTES }))).toBe(
      true,
    );
  });
});
