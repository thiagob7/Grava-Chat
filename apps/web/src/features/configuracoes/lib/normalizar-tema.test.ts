import { describe, expect, it } from "vitest";

import {
  countPickersDated,
  mustTranslate,
  translatePickersLocked,
} from "~/features/configuracoes/lib/normalizar-tema";

describe("seletor preso ao hash de um build", () => {
  it("vira o nome do lugar, que é o que a ponte carimba", () => {
    const output = translatePickersLocked(
      ".ChannelChatLayout\\.module__textareaArea___YjY1N2 { color: red }",
    );

    expect(output).toBe('[class*="ChannelChatLayout.module__textareaArea_"] { color: red }');
  });

  it("traduz cada lado de um seletor aninhado", () => {
    const output = translatePickersLocked(
      ".Menu\\.module__menu___AAA .Item\\.module__item___BBB { color: red }",
    );

    expect(output).toBe(
      '[class*="Menu.module__menu_"] [class*="Item.module__item_"] { color: red }',
    );
  });

  it("solta o div da frente do seletor por pedaço", () => {
    const output = translatePickersLocked(
      'div[class*="MemberListContainer"][class*="memberListContainer"] { color: red }',
    );

    expect(output).toBe(
      '[class*="MemberListContainer"][class*="memberListContainer"] { color: red }',
    );
  });

  it("deixa as outras tags em paz", () => {
    const ready = 'button[class*="Button"] { color: red }';

    expect(translatePickersLocked(ready)).toBe(ready);
  });

  it("não confunde div dentro de nome com a tag", () => {
    const ready = '[class*="Divider.module__divider_"] { color: red }';

    expect(translatePickersLocked(ready)).toBe(ready);
  });

  it("não mexe no que já mira por pedaço", () => {
    const ready = '[class*="GuildNavbar.module__guildNavbarContainer_"] { color: red }';

    expect(translatePickersLocked(ready)).toBe(ready);
  });

  it("não mexe em classe nossa", () => {
    const our = '.area-do-usuario { color: red }\n[data-gc="conversa.message-item.div"] { }';

    expect(translatePickersLocked(our)).toBe(our);
  });

  it("conta quantos presos ao hash o arquivo tem, sem repetir", () => {
    const css = [
      ".A\\.module__a___XX { color: red }",
      ".A\\.module__a___XX:hover { color: blue }",
      ".B\\.module__b___YY { color: red }",
    ].join("\n");

    expect(countPickersDated(css).stuck).toBe(2);
  });

  it("conta os dois tipos de datado em separado", () => {
    const css = [
      ".A\\.module__a___XX { color: red }",
      'div[class*="B.module__b_"] { color: red }',
      'div[class*="C.module__c_"] { color: blue }',
    ].join("\n");

    expect(countPickersDated(css)).toEqual({ stuck: 1, withDiv: 2, loose: 2 });
  });

  it("não conta quem já mira por pedaço", () => {
    const css = '[class*="GuildNavbar.module__guildNavbarContainer_"] { color: red }';

    expect(countPickersDated(css)).toEqual({ stuck: 0, withDiv: 0, loose: 1 });
  });

  it("conta zero num tema escrito para o Gravaê", () => {
    expect(countPickersDated(":root { --color-brand: #123 }")).toEqual({
      stuck: 0,
      withDiv: 0,
      loose: 0,
    });
  });
});

describe("quando traduzir sem perguntar", () => {
  const stuck = (n: number) =>
    Array.from({ length: n }, (_, i) => `.A\\.module__c${i}___XX${i} { color: red }`).join("\n");

  const loose = (n: number) =>
    Array.from({ length: n }, (_, i) => `[class*="A.module__c${i}_"] { color: red }`).join("\n");

  it("deixa como está o tema com seletor solto de sobra", () => {
    expect(mustTranslate(`${stuck(5)}\n${loose(26)}`)).toBe(false);
  });

  it("traduz o tema que é quase só nome preso a build", () => {
    expect(mustTranslate(`${stuck(158)}\n${loose(20)}`)).toBe(true);
  });

  it("deixa como está um tema que não mira classe", () => {
    expect(mustTranslate(":root { --color-brand: #123 }")).toBe(false);
  });
});
