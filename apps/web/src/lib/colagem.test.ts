import { describe, expect, it } from "vitest";

import { cercarCodigo, pareceCodigo, partirEmCodigo, rotuloDaLingua } from "./codigo";

/*
  O caminho inteiro, do Ctrl+V ao bloco desenhado.

  Os testes ao lado provam cada peça sozinha; este prova que elas se encaixam,
  que é onde o conserto pode falhar sem ninguém ver. Foi exatamente esta a
  ligação que faltava: o `partirEmCodigo` sempre funcionou e o `BlocoDeCodigo`
  sempre existiu — só que nada nunca chegava de um ao outro.
*/
const COLADO = `import { cameraTimeline } from "@gravae/ai-analytics";

// mínimo — só path e result
await cameraTimeline({
  path: { left: "/capturas/cam01", right: "/capturas/cam02" },
  result: (ev) => { if (ev.switched) console.log(ev.t, ev.camera); },
});`;

describe("do Ctrl+V ao bloco na tela", () => {
  /*
    Sai "JavaScript", e não "TypeScript", porque é a verdade: o trecho não tem
    uma anotação de tipo sequer, e todo TypeScript sem tipos É JavaScript
    válido. O `adivinharLingua` só separa os dois quando vê `: string`,
    `Promise<>` e companhia — chutar pelo nome do pacote seria adivinhar a
    origem do arquivo, não a linguagem do que está escrito.
  */
  it("o texto do print vira um bloco com a língua no cabeçalho", () => {
    expect(pareceCodigo(COLADO)).toBe(true);

    const pedacos = partirEmCodigo(cercarCodigo(COLADO));

    expect(pedacos).toHaveLength(1);
    expect(pedacos[0]).toMatchObject({ tipo: "bloco", lingua: "js" });
    expect(rotuloDaLingua("js")).toBe("JavaScript");
  });

  /// A cerca tem que devolver o código EXATAMENTE como veio: um espaço a mais
  /// no recuo, ou uma linha comida, e o que a pessoa colou não é o que sai.
  it("não mexe numa vírgula do que foi colado", () => {
    const [pedaco] = partirEmCodigo(cercarCodigo(COLADO));

    expect(pedaco).toMatchObject({ codigo: COLADO });
  });

  /// Colar duas vezes tem que dar dois blocos, não um bloco com cerca dentro.
  it("não cerca o que já tem cerca", () => {
    expect(pareceCodigo(cercarCodigo(COLADO))).toBe(false);
  });

  it("sem língua conhecida o cabeçalho ainda diz o que é", () => {
    expect(rotuloDaLingua(null)).toBe("Código");
  });
});
