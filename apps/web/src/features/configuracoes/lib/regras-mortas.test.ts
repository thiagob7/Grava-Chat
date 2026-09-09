import { describe, expect, it } from "vitest";

import { filtrarRegrasMortas } from "~/features/configuracoes/lib/normalizar-tema";

const EXISTE = { modulos: ["Message", "Markup"], areas: ["channel.message-group"] };

describe("regras que no app da referência já não pegam", () => {
  it("mantém regra sem nome nenhum", () => {
    const css = ":root { --x: 1 }\nbody { color: red }";
    expect(filtrarRegrasMortas(css, EXISTE)).toBe(css);
  });

  it("mantém regra que mira nome vivo lá, tira a que mira só nome morto", () => {
    const css = [
      ".Message\\.module__message___abc { color: red }",
      "div[class*=\"ChannelChatLayout\"][class*=\"messagesArea\"] { outline: 2px solid pink }",
      "[data-flx=\"channel.message-group.group\"] { gap: 0 }",
      "[data-flx=\"app.guilds-layout.main-content\"] { background: none }",
    ].join("\n");

    const saida = filtrarRegrasMortas(css, EXISTE);

    expect(saida).toContain("Message\\.module__message___abc");
    expect(saida).toContain("channel.message-group.group");
    expect(saida).not.toContain("ChannelChatLayout");
    expect(saida).not.toContain("guilds-layout");
  });

  it("uma lista com um vivo é viva", () => {
    const css = ".Markup\\.module__x___1, .Sumido\\.module__y___2 { color: red }";
    expect(filtrarRegrasMortas(css, EXISTE)).toContain("color: red");
  });

  it("desce para dentro de @media e @keyframes sem engolir o bloco", () => {
    const css = [
      "@keyframes brilho { 0% { opacity: 0 } 100% { opacity: 1 } }",
      "@media (min-width: 1px) { .Sumido\\.module__y___2 { color: red } .Markup\\.module__x___1 { color: blue } }",
    ].join("\n");

    const saida = filtrarRegrasMortas(css, EXISTE);

    expect(saida).toContain("@keyframes brilho { 0% { opacity: 0 } 100% { opacity: 1 } }");
    expect(saida).toContain("color: blue");
    expect(saida).not.toContain("color: red");
  });
});
