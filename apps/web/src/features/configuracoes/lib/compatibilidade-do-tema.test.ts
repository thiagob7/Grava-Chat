import { describe, expect, it } from "vitest";

import { conferirCompatibilidade } from "~/features/configuracoes/lib/compatibilidade-do-tema";

describe("compatibilidade com um tema do Fluxer", () => {
  it("acha o que o tema mira e a gente tem", () => {
    const { achados, faltando } = conferirCompatibilidade(`
      [class*="GuildNavbar.module__guildNavbarContainer_"] { border: 1px solid red }
      [data-flx="app.guilds-layout.user-area-wrapper"] { border: 1px solid red }
    `);

    expect(achados).toEqual([
      "GuildNavbar.module__guildNavbarContainer_",
      "app.guilds-layout.user-area-wrapper",
    ]);
    expect(faltando).toEqual([]);
  });

  it("aponta o que não existe aqui", () => {
    const { faltando } = conferirCompatibilidade(
      '[class*="NaoTemNada.module__isso_"] { color: red }',
    );

    expect(faltando).toEqual(["NaoTemNada.module__isso_"]);
  });

  it("não repete o mesmo nome mirado em vários lugares", () => {
    const { faltando } = conferirCompatibilidade(`
      [class*="Sumido.module__x_"] { color: red }
      [class*="Sumido.module__x_"]:hover { color: blue }
    `);

    expect(faltando).toEqual(["Sumido.module__x_"]);
  });

  it("não vê nada num tema escrito para o Gravaê", () => {
    const { achados, faltando } = conferirCompatibilidade(
      ':root { --color-brand: #123 }\n.avatar { border-radius: 0 }',
    );

    expect(achados).toEqual([]);
    expect(faltando).toEqual([]);
  });

  it("lê aspas simples, que o CSS aceita igual", () => {
    const { achados } = conferirCompatibilidade("[class*='Modal.module__root_'] { color: red }");

    expect(achados).toEqual(["Modal.module__root_"]);
  });
});
