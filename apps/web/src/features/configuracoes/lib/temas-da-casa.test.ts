import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import { readThemeHeader } from "@gravae/shared";

import { THEME_CLASSES } from "~/features/configuracoes/lib/ganchos-de-tema";
import { ENGINES, LAYER_NAME, VARIABLE_NAME } from "~/features/tema/lib/fundos";
import knobs from "~/features/configuracoes/lib/macanetas.json";
import tokensLive from "~/features/configuracoes/lib/tokens-vivos.json";

const FOLDER = fileURLToPath(new URL("../../../../../api/temas/", import.meta.url));
const HOUSE_AUTHOR = "Gravaê";

const HOUSE_THEMES = readdirSync(FOLDER)
  .filter((a) => a.endsWith(".css"))
  .sort()
  .map((file) => {
    const css = readFileSync(FOLDER + file, "utf8");
    const header = readThemeHeader(css);

    return {
      key: file.replace(/\.css$/, ""),
      name: header.name ?? "",
      description: header.description ?? "",
      author: header.author ?? "",
      css,
    };
  });

interface Rule {
  picker: string;
  declarations: string[];
}

function rules(css: string): Rule[] {
  const withoutHeader = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const matches: Rule[] = [];

  const walk = (snippet: string) => {
    let start = 0;
    let depth = 0;
    let opening = -1;

    for (let i = 0; i < snippet.length; i++) {
      const letter = snippet[i];

      if (letter === "{") {
        if (depth === 0) opening = i;
        depth++;
        continue;
      }

      if (letter !== "}") continue;

      depth--;
      if (depth > 0) continue;

      const prelude = snippet.slice(start, opening).trim();
      const body = snippet.slice(opening + 1, i);
      start = i + 1;

      if (prelude.startsWith("@")) {
        const name = /^@([a-z-]+)/i.exec(prelude)?.[1]?.toLowerCase();
        if (name === "media" || name === "supports" || name === "layer") walk(body);
        continue;
      }

      matches.push({
        picker: prelude,
        declarations: body
          .split(";")
          .map((d) => d.trim())
          .filter(Boolean)
          .map((d) => d.slice(0, d.indexOf(":")).trim())
          .filter(Boolean),
      });
    }
  };

  walk(withoutHeader);
  return matches;
}

/*
  `--gc-fundo` e `--gc-fundo-camada` não são cor: são o tema escolhendo um
  motor de fundo pelo nome e dizendo se ele pinta atrás ou na frente. O app
  lê as duas em `features/tema/lib/fundos`, então contam como lidas mesmo
  não estando na lista de tokens de tema.
*/
const READ = new Set<string>([
  ...Object.values(knobs as Record<string, string[]>).flat(),
  ...(tokensLive as string[]),
  VARIABLE_NAME,
  LAYER_NAME,
]);

const PALETTE = Object.values(knobs as Record<string, string[]>).map((names) => names[0]!);

const ROOTS = new Set(["html", "body", "#app", ":root"]);

function outsidePieces(picker: string): string[] {
  return picker
    .split(",")
    .map((part) => part.trim())
    .flatMap((part) =>
      part
        .replace(/::?[a-z-]+(\([^)]*\))?/gi, "")
        .split(/[\s>+~]+/)
        .map((piece) => piece.trim())
        .filter(Boolean),
    )
    .filter((piece) => !ROOTS.has(piece) && !THEME_CLASSES.includes(piece.replace(/^\./, "")));
}

describe("temas da casa", () => {
  it("todos têm nome, descrição e a autoria da casa", () => {
    expect(HOUSE_THEMES.length).toBeGreaterThanOrEqual(4);

    for (const theme of HOUSE_THEMES) {
      expect(theme.name, theme.key).not.toBe("");
      expect(theme.description, theme.key).not.toBe("");
      expect(theme.author, theme.key).toBe(HOUSE_AUTHOR);
    }
  });

  it("só pede motor de fundo que existe", () => {
    for (const theme of HOUSE_THEMES) {
      const request = new RegExp(`${VARIABLE_NAME}\\s*:\\s*["']?([a-z0-9-]+)`, "i")
        .exec(theme.css)?.[1];

      if (request) expect(Object.keys(ENGINES), theme.key).toContain(request);
    }
  });

  it("declara a paleta inteira, e nada que o app não leia", () => {
    for (const theme of HOUSE_THEMES) {
      const inRoot = rules(theme.css).filter((r) => r.picker === ":root");
      const declared = inRoot.flatMap((r) => r.declarations);
      const deafened = declared.filter((d) => d.startsWith("--") && !READ.has(d));

      expect(deafened, theme.key).toEqual([]);
      expect(new Set(declared).size, theme.key).toBe(declared.length);

      const missing = PALETTE.filter((name) => !declared.includes(name));
      expect(missing, theme.key).toEqual([]);
    }
  });

  it("só mira raízes da página e ganchos que a gente publica", () => {
    for (const theme of HOUSE_THEMES) {
      const outsiders = rules(theme.css).flatMap((r) => outsidePieces(r.picker));

      expect([...new Set(outsiders)], theme.key).toEqual([]);
    }
  });

  it("não usa !important", () => {
    for (const theme of HOUSE_THEMES) {
      expect(theme.css.includes("!important"), theme.key).toBe(false);
    }
  });

  it("tema que se mexe respeita quem pediu menos movimento", () => {
    for (const theme of HOUSE_THEMES) {
      if (!/\banimation:/.test(theme.css)) continue;

      expect(theme.css, theme.key).toContain("prefers-reduced-motion");
    }
  });
});
