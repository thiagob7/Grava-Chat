import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "src");
const BRIDGE = join(ROOT, "lib", "compat-de-tema.ts");
const FOLDERS_OUTSIDE = new Set(["traducao", "assets", "node_modules"]);

const PLACES = {};
{
  const font = readFileSync(BRIDGE, "utf8");
  const re = /(\w+):\s*\{\s*(?:flx:\s*"[^"]*",\s*)?classes:\s*\[([^\]]*)\]/g;
  let m;
  while ((m = re.exec(font))) {
    PLACES[m[1]] = [...m[2].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
  }
}

const PARTS = {};
for (const classes of Object.values(PLACES)) {
  for (const cssClass of classes) {
    const m = /^([A-Za-z0-9]+)\.module__([A-Za-z0-9]+)_/.exec(cssClass);
    if (m) (PARTS[m[1]] ??= new Set()).add(m[2]);
  }
}

function files(folder, matches = []) {
  for (const item of readdirSync(folder)) {
    if (FOLDERS_OUTSIDE.has(item)) continue;
    const path = join(folder, item);
    if (statSync(path).isDirectory()) files(path, matches);
    else if (extname(path) === ".tsx") matches.push(path);
  }
  return matches;
}

function elementClasses(no, font) {
  const names = [];
  const literals = [];

  const gather = (target, classInside) => {
    if (ts.isCallExpression(target)) {
      const call = target.expression.getText(font);

      if (call === "flx" || call === "flxCls") {
        const first = target.arguments[0];
        if (first && ts.isStringLiteral(first)) names.push(first.text);

        const rest = call === "flx" ? target.arguments.slice(1) : [];
        for (const arg of rest) gather(arg, true);
        return;
      }

      for (const arg of target.arguments) gather(arg, classInside);
      return;
    }

    if (classInside && ts.isStringLiteral(target)) {
      literals.push(target.text);
      return;
    }

    ts.forEachChild(target, (child) => gather(child, classInside));
  };

  for (const attribute of no.attributes.properties) {
    if (ts.isJsxSpreadAttribute(attribute)) {
      gather(attribute.expression, false);
      continue;
    }

    const name = attribute.name?.getText(font);
    const value = attribute.initializer;
    if (!value) continue;

    if (name === "className") {
      if (ts.isStringLiteral(value)) literals.push(value.text);
      else if (ts.isJsxExpression(value) && value.expression) gather(value.expression, true);
    }
  }

  return {
    names,
    utility: literals.flatMap((t) => t.split(/\s+/)).filter(Boolean),
  };
}

const matches = [];

for (const path of files(ROOT)) {
  const text = readFileSync(path, "utf8");
  const font = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  const visit = (no) => {
    if (ts.isJsxOpeningElement(no) || ts.isJsxSelfClosingElement(no)) {
      const { names, utility } = elementClasses(no, font);
      const stamps = names.flatMap((n) => PLACES[n] ?? []);

      if (stamps.length) {
        const mineFiles = new Set(
          stamps.map((c) => /^([A-Za-z0-9]+)\.module__/.exec(c)?.[1]).filter(Boolean),
        );

        for (const file of mineFiles) {
          for (const part of PARTS[file] ?? []) {
            if (stamps.some((c) => c.startsWith(`${file}.module__${part}_`))) continue;

            for (const util of utility) {
              if (!util.includes(part) || stamps.includes(util)) continue;

              const { line } = font.getLineAndCharacterOfPosition(no.getStart(font));

              matches.push(
                `${relative(ROOT, path)}:${line + 1} — ${names[0]}\n` +
                  `    a classe "${util}" tem "${part}" dentro, então ` +
                  `[class*="${file}"][class*="${part}"] pousa aqui sem querer`,
              );
            }
          }
        }
      }
    }

    ts.forEachChild(no, visit);
  };

  visit(font);
}

if (matches.length) {
  console.error(`${matches.length} carimbo(s) pousando errado:\n`);
  for (const a of matches) console.error(`  ${a}\n`);
  console.error("Troque a classe do Tailwind por uma sem a palavra dentro.\n");
  process.exit(1);
}

console.log(`sem fantasmas — ${Object.keys(PARTS).length} arquivos da referência conferidos`);
