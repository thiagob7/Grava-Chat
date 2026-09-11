import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "src");
const FOLDERS_OUTSIDE = new Set(["node_modules", "assets"]);
const HOOK = /^use[A-Z0-9]/;

function files(folder, matches = []) {
  for (const item of readdirSync(folder)) {
    if (FOLDERS_OUTSIDE.has(item)) continue;
    const path = join(folder, item);
    if (statSync(path).isDirectory()) files(path, matches);
    else if (extname(path) === ".ts" || extname(path) === ".tsx") matches.push(path);
  }
  return matches;
}

function hookCalled(no) {
  if (!ts.isCallExpression(no)) return null;
  const target = no.expression;
  if (ts.isIdentifier(target)) return HOOK.test(target.text) ? target.text : null;
  if (ts.isPropertyAccessExpression(target) && ts.isIdentifier(target.name)) {
    return HOOK.test(target.name.text) ? target.name.text : null;
  }
  return null;
}

function isFunction(no) {
  return (
    ts.isFunctionDeclaration(no) ||
    ts.isFunctionExpression(no) ||
    ts.isArrowFunction(no) ||
    ts.isMethodDeclaration(no)
  );
}

function branches(no) {
  return (
    ts.isIfStatement(no) ||
    ts.isSwitchStatement(no) ||
    ts.isCaseClause(no) ||
    ts.isDefaultClause(no) ||
    ts.isConditionalExpression(no) ||
    ts.isForStatement(no) ||
    ts.isForOfStatement(no) ||
    ts.isForInStatement(no) ||
    ts.isWhileStatement(no) ||
    ts.isDoStatement(no)
  );
}

const matches = [];

for (const path of files(ROOT)) {
  const text = readFileSync(path, "utf8");
  const font = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  const body = (no) => {
    if (!no.body || !ts.isBlock(no.body)) return;

    const events = [];

    const gather = (inside, jumping) => {
      if (inside !== no.body && isFunction(inside)) return;

      const name = hookCalled(inside);
      if (name) events.push({ kind: "gancho", name, pos: inside.getStart(font) });

      if (jumping && (ts.isReturnStatement(inside) || ts.isThrowStatement(inside))) {
        events.push({ kind: "saida", pos: inside.getStart(font) });
      }

      ts.forEachChild(inside, (child) => gather(child, jumping || branches(inside)));
    };

    ts.forEachChild(no.body, (child) => gather(child, false));
    events.sort((a, b) => a.pos - b.pos);

    const exit = events.find((e) => e.kind === "saida");
    if (!exit) return;

    const late = events.filter((e) => e.kind === "gancho" && e.pos > exit.pos);
    if (!late.length) return;

    const { line } = font.getLineAndCharacterOfPosition(exit.pos);

    matches.push(
      `${relative(ROOT, path)}:${line + 1}\n` +
        `    a saída acontece antes de ${late.map((g) => g.name).join(", ")}, ` +
        `então uma renderização chama menos ganchos que a anterior`,
    );
  };

  const visit = (no) => {
    if (isFunction(no)) body(no);
    ts.forEachChild(no, visit);
  };

  visit(font);
}

if (matches.length) {
  console.error(`${matches.length} gancho(s) depois de uma saída:\n`);
  for (const a of matches) console.error(`  ${a}\n`);
  console.error("Suba a chamada para antes do return — é o erro #300 do React.\n");
  process.exit(1);
}

console.log("ordem dos ganchos ok");
