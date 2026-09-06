import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { describe, expect, it } from "vitest";

/*
  O script anti-piscada mora no `index.html`, porque precisa rodar antes do
  primeiro quadro — antes de existir React para testar. Então o teste vai
  buscá-lo lá e roda de verdade, com um documento e um armazenamento de
  mentira. Se alguém mexer no HTML e quebrar a conta, quebra aqui.
*/
const raiz = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(raiz, "..", "..", "..", "..", "index.html"), "utf8");
const hook = readFileSync(
  join(raiz, "..", "hooks", "use-aparencia.ts"),
  "utf8",
);

const corpo = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1] ?? "";

interface Falso {
  dataset: Record<string, string>;
  classes: string[];
  props: Record<string, string>;
}

function rodar(guardado: Record<string, unknown>): Falso {
  const falso: Falso = { dataset: {}, classes: [], props: {} };

  const documento = {
    documentElement: {
      dataset: falso.dataset,
      classList: { add: (nome: string) => falso.classes.push(nome) },
      style: {
        setProperty: (nome: string, valor: string) => {
          falso.props[nome] = valor;
        },
      },
    },
  };

  const armazem = {
    getItem: (chave: string) =>
      chave in guardado ? JSON.stringify(guardado[chave]) : null,
  };

  new Function("document", "localStorage", corpo)(documento, armazem);

  return falso;
}

describe("script anti-piscada", () => {
  it("existe, e roda antes do módulo do app", () => {
    expect(corpo.length).toBeGreaterThan(0);
    expect(html.indexOf("<script>")).toBeLessThan(
      html.indexOf('src="/src/main.tsx"'),
    );
  });

  it("põe o tema de fábrica quando não há nada guardado", () => {
    const { dataset, classes } = rodar({});

    expect(dataset.tema).toBe("escuro");
    expect(dataset.densidade).toBe("confortavel");
    expect(classes).toContain("theme-dark");
  });

  it("põe o tema claro antes de qualquer pintura", () => {
    const { dataset, classes } = rodar({
      "gravae:aparencia": { tema: "claro", densidade: "compacta" },
    });

    expect(dataset.tema).toBe("claro");
    expect(dataset.densidade).toBe("compacta");
    expect(classes).toContain("theme-light");
  });

  it("aplica as cores do estúdio", () => {
    const { props } = rodar({
      "gravae:estudio": {
        substituicoes: { "--color-surface-0": "#010203", naoEhToken: "x" },
      },
    });

    expect(props["--color-surface-0"]).toBe("#010203");
    expect(props.naoEhToken).toBeUndefined();
  });

  /*
    A mesma regra do `use-aparencia.ts`: quem escolheu a marca no estúdio ganha
    da cor de destaque. Sem isto o app abriria com a cor de destaque e trocaria
    para a do tema no primeiro efeito — a piscada que este script existe para
    tirar, só que na marca.
  */
  it("deixa a marca do estúdio ganhar da cor de destaque", () => {
    const semEstudio = rodar({
      "gravae:aparencia": { destaque: "#ff0000" },
    });
    expect(semEstudio.props["--color-brand"]).toBe("#ff0000");

    const comEstudio = rodar({
      "gravae:aparencia": { destaque: "#ff0000" },
      "gravae:estudio": { substituicoes: { "--color-brand": "#00ff00" } },
    });
    expect(comEstudio.props["--color-brand"]).toBe("#00ff00");
  });

  it("não derruba a página quando o guardado está podre", () => {
    const documento = {
      documentElement: {
        dataset: {} as Record<string, string>,
        classList: { add: () => {} },
        style: { setProperty: () => {} },
      },
    };

    const armazem = {
      getItem: () => "{ isto não é json",
    };

    expect(() =>
      new Function("document", "localStorage", corpo)(documento, armazem),
    ).not.toThrow();
  });

  /*
    As marcas escritas no HTML são as mesmas que o hook escreve depois. Se uma
    ponta ganhar uma marca nova e a outra não, volta a piscar naquele detalhe —
    e ninguém repara até alguém reclamar. Esta é a cobrança que falta ao HTML.
  */
  it("escreve as mesmas marcas que o hook de aparência", () => {
    const marcas = ["tema", "densidade", "cantos", "animacao", "foco"];

    const soNoHtml = marcas.filter(
      (marca) => corpo.includes(`dataset.${marca}`) && !hook.includes(`dataset.${marca}`),
    );
    const soNoHook = marcas.filter(
      (marca) => hook.includes(`dataset.${marca}`) && !corpo.includes(`dataset.${marca}`),
    );

    expect({ soNoHtml, soNoHook }).toEqual({ soNoHtml: [], soNoHook: [] });
  });
});
