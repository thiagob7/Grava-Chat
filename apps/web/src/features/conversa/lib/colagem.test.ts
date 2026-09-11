import { describe, expect, it } from "vitest";

import { surroundCode, looksCode, fromCode, languageLabel } from "./codigo";

const PASTED = `import { cameraTimeline } from "@gravae/ai-analytics";

await cameraTimeline({
  path: { left: "/capturas/cam01", right: "/capturas/cam02" },
  result: (ev) => { if (ev.switched) console.log(ev.t, ev.camera); },
});`;

describe("do Ctrl+V ao bloco na tela", () => {
  it("o texto do print vira um bloco com a língua no cabeçalho", () => {
    expect(looksCode(PASTED)).toBe(true);

    const pieces = fromCode(surroundCode(PASTED));

    expect(pieces).toHaveLength(1);
    expect(pieces[0]).toMatchObject({ kind: "bloco", language: "js" });
    expect(languageLabel("js")).toBe("JavaScript");
  });

  it("não mexe numa vírgula do que foi colado", () => {
    const [piece] = fromCode(surroundCode(PASTED));

    expect(piece).toMatchObject({ code: PASTED });
  });

  it("não cerca o que já tem cerca", () => {
    expect(looksCode(surroundCode(PASTED))).toBe(false);
  });

  it("sem língua conhecida o cabeçalho ainda diz o que é", () => {
    expect(languageLabel(null)).toBe("Código");
  });
});
