import { describe, expect, it } from "vitest";

import {
  contarSeletoresDatados,
  deveTraduzir,
  traduzirSeletoresTravados,
} from "~/features/configuracoes/lib/normalizar-tema";

describe("seletor preso ao hash de um build", () => {
  it("vira o nome do lugar, que é o que a ponte carimba", () => {
    const saida = traduzirSeletoresTravados(
      ".ChannelChatLayout\\.module__textareaArea___YjY1N2 { color: red }",
    );

    expect(saida).toBe('[class*="ChannelChatLayout.module__textareaArea_"] { color: red }');
  });

  it("traduz cada lado de um seletor aninhado", () => {
    const saida = traduzirSeletoresTravados(
      ".Menu\\.module__menu___AAA .Item\\.module__item___BBB { color: red }",
    );

    expect(saida).toBe(
      '[class*="Menu.module__menu_"] [class*="Item.module__item_"] { color: red }',
    );
  });

  it("solta o div da frente do seletor por pedaço", () => {
    const saida = traduzirSeletoresTravados(
      'div[class*="MemberListContainer"][class*="memberListContainer"] { color: red }',
    );

    expect(saida).toBe(
      '[class*="MemberListContainer"][class*="memberListContainer"] { color: red }',
    );
  });

  it("deixa as outras tags em paz", () => {
    const pronto = 'button[class*="Button"] { color: red }';

    expect(traduzirSeletoresTravados(pronto)).toBe(pronto);
  });

  it("não confunde div dentro de nome com a tag", () => {
    const pronto = '[class*="Divider.module__divider_"] { color: red }';

    expect(traduzirSeletoresTravados(pronto)).toBe(pronto);
  });

  it("não mexe no que já mira por pedaço", () => {
    const pronto = '[class*="GuildNavbar.module__guildNavbarContainer_"] { color: red }';

    expect(traduzirSeletoresTravados(pronto)).toBe(pronto);
  });

  it("não mexe em classe nossa", () => {
    const nosso = '.area-do-usuario { color: red }\n[data-gc="conversa.message-item.div"] { }';

    expect(traduzirSeletoresTravados(nosso)).toBe(nosso);
  });

  it("conta quantos presos ao hash o arquivo tem, sem repetir", () => {
    const css = [
      ".A\\.module__a___XX { color: red }",
      ".A\\.module__a___XX:hover { color: blue }",
      ".B\\.module__b___YY { color: red }",
    ].join("\n");

    expect(contarSeletoresDatados(css).presos).toBe(2);
  });

  it("conta os dois tipos de datado em separado", () => {
    const css = [
      ".A\\.module__a___XX { color: red }",
      'div[class*="B.module__b_"] { color: red }',
      'div[class*="C.module__c_"] { color: blue }',
    ].join("\n");

    expect(contarSeletoresDatados(css)).toEqual({ presos: 1, comDiv: 2, soltos: 2 });
  });

  it("não conta quem já mira por pedaço", () => {
    const css = '[class*="GuildNavbar.module__guildNavbarContainer_"] { color: red }';

    expect(contarSeletoresDatados(css)).toEqual({ presos: 0, comDiv: 0, soltos: 1 });
  });

  it("conta zero num tema escrito para o Gravaê", () => {
    expect(contarSeletoresDatados(":root { --color-brand: #123 }")).toEqual({
      presos: 0,
      comDiv: 0,
      soltos: 0,
    });
  });
});

describe("quando traduzir sem perguntar", () => {
  const preso = (n: number) =>
    Array.from({ length: n }, (_, i) => `.A\\.module__c${i}___XX${i} { color: red }`).join("\n");

  const solto = (n: number) =>
    Array.from({ length: n }, (_, i) => `[class*="A.module__c${i}_"] { color: red }`).join("\n");

  it("deixa como está o tema com seletor solto de sobra", () => {
    expect(deveTraduzir(`${preso(5)}\n${solto(26)}`)).toBe(false);
  });

  it("traduz o tema que é quase só nome preso a build", () => {
    expect(deveTraduzir(`${preso(158)}\n${solto(20)}`)).toBe(true);
  });

  it("deixa como está um tema que não mira classe", () => {
    expect(deveTraduzir(":root { --color-brand: #123 }")).toBe(false);
  });
});
