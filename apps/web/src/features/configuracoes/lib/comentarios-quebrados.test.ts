import { describe, expect, it } from "vitest";

import {
  findCommentsBroken,
  fixCommentsBroken,
} from "~/features/configuracoes/lib/comentarios-quebrados";

const BROKEN = [
  "body {",
  "  /* decide o arredondamento | Options: off, on",
  "   */* see also: --ThemeRoundingMultiplier */",
  "   --UseDefaultRounding: off;",
  "   --ThemePanelLabels: on;",
  "}",
].join("\n");

describe("comentário quebrado no CSS", () => {
  it("acha a quebra e diz qual variável some com ela", () => {
    const matches = findCommentsBroken(BROKEN);

    expect(matches).toHaveLength(1);
    expect(matches[0]?.variable).toBe("--UseDefaultRounding");
    expect(matches[0]?.line).toBe(3);
  });

  it("não acusa comentário são", () => {
    expect(
      findCommentsBroken("/* isto é um comentário */\n:root { --a: 1 }"),
    ).toEqual([]);
  });

  it("não acusa dois comentários seguidos", () => {
    expect(findCommentsBroken("/* um */\n/* outro */\n:root { --a: 1 }")).toEqual([]);
  });

  it("conserta devolvendo o fecha e tirando o lixo", () => {
    const fixed = fixCommentsBroken(BROKEN);

    expect(findCommentsBroken(fixed)).toEqual([]);
    expect(fixed).toContain("--UseDefaultRounding: off;");
    expect(fixed).toContain("--ThemePanelLabels: on;");
    expect(fixed).not.toContain("see also");
  });

  it("acha as duas quebras quando há duas", () => {
    const two = `${BROKEN}\n${BROKEN}`;

    expect(findCommentsBroken(two)).toHaveLength(2);
  });
});
