import { describe, expect, it } from "vitest";

import { cercarCodigo, pareceCodigo, partirEmCodigo, rotuloDaLingua } from "./codigo";

const COLADO = `import { cameraTimeline } from "@gravae/ai-analytics";

// mínimo — só path e result
await cameraTimeline({
  path: { left: "/capturas/cam01", right: "/capturas/cam02" },
  result: (ev) => { if (ev.switched) console.log(ev.t, ev.camera); },
});`;

describe("do Ctrl+V ao bloco na tela", () => {
  it("o texto do print vira um bloco com a língua no cabeçalho", () => {
    expect(pareceCodigo(COLADO)).toBe(true);

    const pedacos = partirEmCodigo(cercarCodigo(COLADO));

    expect(pedacos).toHaveLength(1);
    expect(pedacos[0]).toMatchObject({ tipo: "bloco", lingua: "js" });
    expect(rotuloDaLingua("js")).toBe("JavaScript");
  });

  it("não mexe numa vírgula do que foi colado", () => {
    const [pedaco] = partirEmCodigo(cercarCodigo(COLADO));

    expect(pedaco).toMatchObject({ codigo: COLADO });
  });

  it("não cerca o que já tem cerca", () => {
    expect(pareceCodigo(cercarCodigo(COLADO))).toBe(false);
  });

  it("sem língua conhecida o cabeçalho ainda diz o que é", () => {
    expect(rotuloDaLingua(null)).toBe("Código");
  });
});
