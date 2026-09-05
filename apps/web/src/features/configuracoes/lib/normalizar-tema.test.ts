import { describe, expect, it } from "vitest";

import {
  contarSeletoresTravados,
  normalizarSeletoresDoFluxer,
} from "~/features/configuracoes/lib/normalizar-tema";

describe("seletor travado no hash", () => {
  it("vira o seletor por pedaço, que é o que acha os nossos elementos", () => {
    const saida = normalizarSeletoresDoFluxer(
      ".ChannelChatLayout\\.module__textareaArea___YjY1N2 { color: red }",
    );

    expect(saida).toBe('[class*="ChannelChatLayout.module__textareaArea_"] { color: red }');
  });

  it("traduz os dois lados de um seletor aninhado", () => {
    const saida = normalizarSeletoresDoFluxer(
      ".Menu\\.module__menu___AAA .Item\\.module__item___BBB { color: red }",
    );

    expect(saida).toBe(
      '[class*="Menu.module__menu_"] [class*="Item.module__item_"] { color: red }',
    );
  });

  /// O que já mira por pedaço está certo e não pode ser mexido.
  it("não mexe no que já está solto do hash", () => {
    const pronto = '[class*="GuildNavbar.module__guildNavbarContainer_"] { color: red }';

    expect(normalizarSeletoresDoFluxer(pronto)).toBe(pronto);
  });

  it("não mexe em classe nossa", () => {
    const nosso = '.area-do-usuario { color: red }\n[data-gc="conversa.message-item.div"] { }';

    expect(normalizarSeletoresDoFluxer(nosso)).toBe(nosso);
  });

  it("conta quantos travados o arquivo tem, sem repetir", () => {
    const css = [
      ".A\\.module__a___XX { color: red }",
      ".A\\.module__a___XX:hover { color: blue }",
      ".B\\.module__b___YY { color: red }",
    ].join("\n");

    expect(contarSeletoresTravados(css)).toBe(2);
  });

  it("conta zero num tema escrito para o Gravaê", () => {
    expect(contarSeletoresTravados(":root { --color-brand: #123 }")).toBe(0);
  });
});
