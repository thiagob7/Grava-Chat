import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { describe, expect, it } from "vitest";

import { PLACES } from "~/lib/compat-de-tema";

const root = dirname(fileURLToPath(import.meta.url));

const IGNORED = new Set(["traducao", "assets"]);

function todoCode(): string {
  const parts: string[] = [];

  const walk = (folder: string) => {
    for (const item of readdirSync(folder, { withFileTypes: true })) {
      const path = join(folder, item.name);

      if (item.isDirectory()) {
        if (!IGNORED.has(item.name)) walk(path);
      } else if (
        /\.tsx?$/.test(item.name) &&
        !item.name.endsWith(".test.ts") &&
        item.name !== "compat-de-tema.ts"
      ) {
        parts.push(readFileSync(path, "utf8"));
      }
    }
  };

  walk(join(root, ".."));

  return parts.join("\n");
}

const names = Object.keys(PLACES);
const code = todoCode();

describe("compatibilidade com temas da referência", () => {
  it("carimba em algum elemento cada lugar do mapa", () => {
    const orphans = names.filter((name) => !code.includes(`"${name}"`));

    expect(orphans).toEqual([]);
  });

  it("não repete o mesmo nome da referência em dois lugares", () => {
    const seen = new Map<string, string>();
    const repeated: string[] = [];

    for (const [place, target] of Object.entries(PLACES)) {
      for (const cssClass of target.classes) {
        const owner = seen.get(cssClass);
        if (owner) repeated.push(`${cssClass}: ${owner} e ${place}`);
        else seen.set(cssClass, place);
      }

      const path: string = "flx" in target ? target.flx : "";
      if (!path) continue;

      const flxOwner = seen.get(path);
      if (flxOwner) repeated.push(`${path}: ${flxOwner} e ${place}`);
      else seen.set(path, place);
    }

    expect(repeated).toEqual([]);
  });

  it("termina toda classe de ponte em _gc", () => {
    const outside = Object.values(PLACES)
      .flatMap((target) => target.classes as readonly string[])
      .filter((cssClass) => !cssClass.endsWith("_gc"));

    expect(outside).toEqual([]);
  });

  it("mira o data-flx com o caminho que a referência usa", () => {
    const outside: string[] = [];

    for (const target of Object.values(PLACES)) {
      const path: string = "flx" in target ? target.flx : "";
      if (!path) continue;

      if (!/^[a-z0-9]+(\.[a-z0-9-]+)+$/.test(path)) outside.push(path);
    }

    expect(outside).toEqual([]);
  });
});
