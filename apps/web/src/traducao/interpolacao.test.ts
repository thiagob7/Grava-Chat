import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import ts from "typescript";

import { ptBR } from "./pt-br";

/*
  O buraco que este teste tapa.

  A chave do `t()` é string, e o que vai nela é objeto. Quando alguém renomeia
  a propriedade do objeto e esquece do `{{...}}` do catálogo, nada quebra: nem
  o compilador nem o i18next reclamam. A tela só mostra `{{hora}}` cru para
  quem estiver usando.

  Foi o que aconteceu em 11/09/2026, quando o código virou inglês e os nomes
  de interpolação ficaram para trás.
*/
const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, "..");

const placeholders = new Map<string, string[]>();

const flatten = (node: unknown, prefix: string) => {
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      const names = [...value.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]!);
      if (names.length) placeholders.set(path, [...new Set(names)]);
    } else if (value && typeof value === "object") {
      flatten(value, path);
    }
  }
};
flatten(ptBR, "");

const files: string[] = [];
const walkFolder = (folder: string) => {
  for (const item of readdirSync(folder, { withFileTypes: true })) {
    if (item.name === "traducao" || item.name === "assets") continue;
    const path = join(folder, item.name);
    if (item.isDirectory()) walkFolder(path);
    else if (/\.tsx?$/.test(item.name)) files.push(path);
  }
};
walkFolder(src);

const CALLS = new Set(["t", "translate"]);

function missing(path: string) {
  const source = ts.createSourceFile(
    path,
    readFileSync(path, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const holes: string[] = [];

  const walk = (node: ts.Node) => {
    if (ts.isCallExpression(node)) {
      const target = ts.isIdentifier(node.expression)
        ? node.expression.text
        : ts.isPropertyAccessExpression(node.expression)
          ? node.expression.name.text
          : "";
      const options = node.arguments[1];

      if (CALLS.has(target) && options && ts.isObjectLiteralExpression(options)) {
        const given = new Set(
          options.properties
            .map((p) => (p.name && ts.isIdentifier(p.name) ? p.name.text : ""))
            .filter(Boolean),
        );
        const spread = options.properties.some(ts.isSpreadAssignment);

        const keys = [node.arguments[0]!]
          .flatMap((first) =>
            ts.isStringLiteral(first)
              ? [first.text]
              : ts.isConditionalExpression(first)
                ? [first.whenTrue, first.whenFalse]
                  .filter(ts.isStringLiteral)
                  .map((n) => n.text)
                : [],
          );

        for (const key of keys) {
          const wanted = placeholders.get(key);
          if (!wanted || spread) continue;
          for (const name of wanted) {
            if (!given.has(name)) holes.push(`${key} pede {{${name}}}`);
          }
        }
      }
    }
    node.forEachChild(walk);
  };
  walk(source);

  return holes;
}

describe("interpolação das telas", () => {
  it("toda chamada entrega os nomes que o catálogo pede", () => {
    const holes = files.flatMap((path) =>
      missing(path).map((hole) => `${path.replace(`${src}/`, "")} :: ${hole}`),
    );

    expect(holes).toEqual([]);
  });
});
