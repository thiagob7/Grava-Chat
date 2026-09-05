import { describe, expect, it } from "vitest";
import type { Attachment } from "@gravae/shared";

import { MAIOR_PREVIA_BYTES, ehAnexoDeTexto, extensaoDe } from "./anexo-de-texto";

const anexo = (parcial: Partial<Attachment>): Attachment => ({
  id: "1",
  url: "https://exemplo/arquivo",
  filename: "arquivo.txt",
  contentType: "text/plain",
  size: 1024,
  ...parcial,
});

describe("extensao do arquivo", () => {
  it("pega a ultima, mesmo com ponto no meio", () => {
    expect(extensaoDe("FR_QuietSystemGruvbox.min.css")).toBe("css");
  });

  it("devolve vazio quando nao ha ponto", () => {
    expect(extensaoDe("Dockerfile")).toBe("");
  });

  it("nao se importa com caixa alta", () => {
    expect(extensaoDe("LEIA.MD")).toBe("md");
  });
});

describe("vale previa com realce?", () => {
  it("sim para tipo de texto declarado", () => {
    expect(ehAnexoDeTexto(anexo({ contentType: "text/css" }))).toBe(true);
    expect(ehAnexoDeTexto(anexo({ contentType: "application/json" }))).toBe(true);
  });

  it("sim quando o tipo vem generico mas o nome entrega", () => {
    expect(
      ehAnexoDeTexto(anexo({ contentType: "application/octet-stream", filename: "vite.config.ts" })),
    ).toBe(true);
  });

  it("nao para imagem, video e binario", () => {
    expect(ehAnexoDeTexto(anexo({ contentType: "image/png", filename: "foto.png" }))).toBe(false);
    expect(ehAnexoDeTexto(anexo({ contentType: "video/mp4", filename: "clipe.mp4" }))).toBe(false);
    expect(
      ehAnexoDeTexto(anexo({ contentType: "application/zip", filename: "tudo.zip" })),
    ).toBe(false);
  });

  it("nao baixa arquivo grande so para mostrar sete linhas", () => {
    expect(
      ehAnexoDeTexto(anexo({ contentType: "text/plain", size: MAIOR_PREVIA_BYTES + 1 })),
    ).toBe(false);
  });

  it("aceita exatamente no limite", () => {
    expect(ehAnexoDeTexto(anexo({ contentType: "text/plain", size: MAIOR_PREVIA_BYTES }))).toBe(
      true,
    );
  });
});
