import { describe, expect, it } from "vitest";

import {
  acharComentariosQuebrados,
  consertarComentariosQuebrados,
} from "~/features/configuracoes/lib/comentarios-quebrados";

const QUEBRADO = [
  "body {",
  "  /* decide o arredondamento | Options: off, on",
  "   */* see also: --ThemeRoundingMultiplier */",
  "   --UseDefaultRounding: off;",
  "   --ThemePanelLabels: on;",
  "}",
].join("\n");

describe("comentário quebrado no CSS", () => {
  it("acha a quebra e diz qual variável some com ela", () => {
    const achados = acharComentariosQuebrados(QUEBRADO);

    expect(achados).toHaveLength(1);
    expect(achados[0]?.variavel).toBe("--UseDefaultRounding");
    expect(achados[0]?.linha).toBe(3);
  });

  it("não acusa comentário são", () => {
    expect(
      acharComentariosQuebrados("/* isto é um comentário */\n:root { --a: 1 }"),
    ).toEqual([]);
  });

  it("não acusa dois comentários seguidos", () => {
    expect(acharComentariosQuebrados("/* um */\n/* outro */\n:root { --a: 1 }")).toEqual([]);
  });

  it("conserta devolvendo o fecha e tirando o lixo", () => {
    const consertado = consertarComentariosQuebrados(QUEBRADO);

    expect(acharComentariosQuebrados(consertado)).toEqual([]);
    expect(consertado).toContain("--UseDefaultRounding: off;");
    expect(consertado).toContain("--ThemePanelLabels: on;");
    expect(consertado).not.toContain("see also");
  });

  it("acha as duas quebras quando há duas", () => {
    const duas = `${QUEBRADO}\n${QUEBRADO}`;

    expect(acharComentariosQuebrados(duas)).toHaveLength(2);
  });
});
