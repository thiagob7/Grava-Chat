import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { describe, expect, it } from "vitest";

const root = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(root, "..", "..", "..", "..", "index.html"), "utf8");
const hook = readFileSync(
  join(root, "..", "hooks", "use-aparencia.ts"),
  "utf8",
);

const body = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1] ?? "";

interface IsFalse {
  dataset: Record<string, string>;
  classes: string[];
  props: Record<string, string>;
}

function run(kept: Record<string, unknown>): IsFalse {
  const isFalse: IsFalse = { dataset: {}, classes: [], props: {} };

  const doc = {
    documentElement: {
      dataset: isFalse.dataset,
      classList: { add: (name: string) => isFalse.classes.push(name) },
      style: {
        setProperty: (name: string, value: string) => {
          isFalse.props[name] = value;
        },
      },
    },
  };

  const warehouse = {
    getItem: (key: string) =>
      key in kept ? JSON.stringify(kept[key]) : null,
  };

  new Function("document", "localStorage", body)(doc, warehouse);

  return isFalse;
}

describe("script anti-piscada", () => {
  it("existe, e roda antes do módulo do app", () => {
    expect(body.length).toBeGreaterThan(0);
    expect(html.indexOf("<script>")).toBeLessThan(
      html.indexOf('src="/src/main.tsx"'),
    );
  });

  it("põe o tema de fábrica quando não há nada guardado", () => {
    const { dataset, classes } = run({});

    expect(dataset.tema).toBe("escuro");
    expect(dataset.densidade).toBe("confortavel");
    expect(classes).toContain("theme-dark");
  });

  it("põe o tema claro antes de qualquer pintura", () => {
    const { dataset, classes } = run({
      "gravae:aparencia": { theme: "claro", density: "compacta" },
    });

    expect(dataset.tema).toBe("claro");
    expect(dataset.densidade).toBe("compacta");
    expect(classes).toContain("theme-light");
  });

  it("aplica as cores do estúdio", () => {
    const { props } = run({
      "gravae:estudio": {
        overrides: { "--color-surface-0": "#010203", notIsToken: "x" },
      },
    });

    expect(props["--color-surface-0"]).toBe("#010203");
    expect(props.notIsToken).toBeUndefined();
  });

  it("deixa a marca do estúdio ganhar da cor de destaque", () => {
    const withoutStudio = run({
      "gravae:aparencia": { highlight: "#ff0000" },
    });
    expect(withoutStudio.props["--color-brand"]).toBe("#ff0000");

    const withStudio = run({
      "gravae:aparencia": { highlight: "#ff0000" },
      "gravae:estudio": { overrides: { "--color-brand": "#00ff00" } },
    });
    expect(withStudio.props["--color-brand"]).toBe("#00ff00");
  });

  it("não derruba a página quando o guardado está podre", () => {
    const doc = {
      documentElement: {
        dataset: {} as Record<string, string>,
        classList: { add: () => {} },
        style: { setProperty: () => {} },
      },
    };

    const warehouse = {
      getItem: () => "{ isto não é json",
    };

    expect(() =>
      new Function("document", "localStorage", body)(doc, warehouse),
    ).not.toThrow();
  });

  it("escreve as mesmas marcas que o hook de aparência", () => {
    const brands = ["tema", "densidade", "cantos", "animacao", "foco"];

    const soNoHtml = brands.filter(
      (brand) => body.includes(`dataset.${brand}`) && !hook.includes(`dataset.${brand}`),
    );
    const soNoHook = brands.filter(
      (brand) => hook.includes(`dataset.${brand}`) && !body.includes(`dataset.${brand}`),
    );

    expect({ soNoHtml, soNoHook }).toEqual({ soNoHtml: [], soNoHook: [] });
  });
});
