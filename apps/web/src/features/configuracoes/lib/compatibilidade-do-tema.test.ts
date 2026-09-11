import { describe, expect, it } from "vitest";

import { checkCompatibility } from "~/features/configuracoes/lib/compatibilidade-do-tema";

describe("compatibilidade com um tema da referência", () => {
  it("acha o que o tema mira e a gente tem", () => {
    const { matches, missing } = checkCompatibility(`
      [class*="GuildNavbar.module__guildNavbarContainer_"] { border: 1px solid red }
      [data-flx="app.guilds-layout.user-area-wrapper"] { border: 1px solid red }
    `);

    expect(matches).toEqual([
      "GuildNavbar.module__guildNavbarContainer_",
      "app.guilds-layout.user-area-wrapper",
    ]);
    expect(missing).toEqual([]);
  });

  it("aponta o que não existe aqui", () => {
    const { missing } = checkCompatibility(
      '[class*="NaoTemNada.module__isso_"] { color: red }',
    );

    expect(missing).toEqual(["NaoTemNada.module__isso_"]);
  });

  it("não repete o mesmo nome mirado em vários lugares", () => {
    const { missing } = checkCompatibility(`
      [class*="Sumido.module__x_"] { color: red }
      [class*="Sumido.module__x_"]:hover { color: blue }
    `);

    expect(missing).toEqual(["Sumido.module__x_"]);
  });

  it("não vê nada num tema escrito para o Gravaê", () => {
    const { matches, missing } = checkCompatibility(
      ':root { --color-brand: #123 }\n.avatar { border-radius: 0 }',
    );

    expect(matches).toEqual([]);
    expect(missing).toEqual([]);
  });

  it("lê aspas simples, que o CSS aceita igual", () => {
    const { matches } = checkCompatibility("[class*='Modal.module__root_'] { color: red }");

    expect(matches).toEqual(["Modal.module__root_"]);
  });
});
