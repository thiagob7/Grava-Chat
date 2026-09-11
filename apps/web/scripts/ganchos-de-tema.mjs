import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "src");
const LIST = join(HERE, "..", "src", "features", "configuracoes", "lib", "ganchos.json");

const ATTRIBUTE = "data-gc";

const FOLDERS_OUTSIDE = new Set(["traducao", "assets", "node_modules"]);

const WITHOUT_DOM = new Set([
  "Fragment",
  "React.Fragment",
  "Suspense",
  "StrictMode",
  "BrowserRouter",
  "Routes",
  "Route",
  "Navigate",
  "QueryClientProvider",
  "TooltipProvider",
  "ConfirmProvider",
  "SessionProvider",
  "ErrorBoundary",
  "Helmet",
]);

const FINAL_WITHOUT_DOM = new Set(["Provider", "Consumer", "Portal", "Trigger", "Close"]);

const SEGMENTS_GENERIC = new Set([
  "components",
  "component",
  "hooks",
  "lib",
  "stores",
  "pages",
  "presentation",
  "src",
]);

function kebab(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function fileScope(path) {
  const parts = relative(ROOT, path)
    .split(sep)
    .join("/")
    .replace(/\.[jt]sx$/, "")
    .split("/")
    .filter(Boolean);

  const clean = [];

  parts.forEach((part, index) => {
    if (index === 0 && part === "features") return;

    const token = kebab(part);
    if (!token) return;

    if (SEGMENTS_GENERIC.has(token) && index !== parts.length - 1) return;

    clean.push(token);
  });

  if (clean.at(-1) === "index" && clean.length > 1) clean.pop();

  return clean.join(".");
}

function elementName(no) {
  const tag = no.tagName;

  if (ts.isIdentifier(tag)) return tag.text;
  if (ts.isPropertyAccessExpression(tag)) return `${tag.expression.getText()}.${tag.name.text}`;

  return tag.getText();
}

const isWithoutDom = (name) =>
  WITHOUT_DOM.has(name) || FINAL_WITHOUT_DOM.has(name.split(".").pop() ?? "");

function elementAction(no) {
  for (const attribute of no.attributes.properties) {
    if (!ts.isJsxAttribute(attribute) || !attribute.name) continue;

    const name = attribute.name.getText();
    if (!/^on[A-Z]/.test(name)) continue;

    const value = attribute.initializer;
    if (!value || !ts.isJsxExpression(value) || !value.expression) continue;

    const target = value.expression;

    if (ts.isIdentifier(target)) return kebab(target.text);
    if (ts.isPropertyAccessExpression(target)) return kebab(target.name.text);
  }

  return "";
}

function alreadyHasHook(no) {
  return no.attributes.properties.find(
    (a) => ts.isJsxAttribute(a) && a.name?.getText() === ATTRIBUTE,
  );
}

function doProcess(path, text) {
  const font = ts.createSourceFile(
    path,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );

  const scope = fileScope(path);
  const edits = [];
  const used = new Map();
  const hooks = [];

  const visit = (no) => {
    if (ts.isJsxOpeningElement(no) || ts.isJsxSelfClosingElement(no)) {
      const name = elementName(no);

      if (!isWithoutDom(name)) {
        const action = elementAction(no);
        const base = [scope, kebab(name), action].filter(Boolean).join(".");

        const times = (used.get(base) ?? 0) + 1;
        used.set(base, times);

        const value = times === 1 ? base : `${base}--${times}`;
        hooks.push(value);

        const existing = alreadyHasHook(no);

        if (existing) {
          if (existing.initializer && ts.isStringLiteral(existing.initializer)) {
            if (existing.initializer.text !== value) {
              edits.push({
                start: existing.initializer.getStart(font),
                end: existing.initializer.getEnd(),
                text: `"${value}"`,
              });
            }
          }
        } else {
          const position = (no.typeArguments?.end ?? no.tagName.getEnd()) + (no.typeArguments ? 1 : 0);

          edits.push({ start: position, end: position, text: ` ${ATTRIBUTE}="${value}"` });
        }
      }
    }

    ts.forEachChild(no, visit);
  };

  visit(font);

  let output = text;

  for (const edit of [...edits].sort((a, b) => b.start - a.start)) {
    output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
  }

  if (output !== text) {
    const check = ts.createSourceFile(
      path,
      output,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );

    if (check.parseDiagnostics?.length) {
      const error = check.parseDiagnostics[0];
      const { line } = check.getLineAndCharacterOfPosition(error.start ?? 0);

      throw new Error(
        `${relative(ROOT, path)}:${line + 1} — o gancho quebraria o arquivo: ` +
          ts.flattenDiagnosticMessageText(error.messageText, " "),
      );
    }
  }

  return { output, changed: output !== text, hooks };
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

const mode = process.argv[2] ?? "";
const check = mode === "--check";
const soList = mode === "--lista";

let touched = 0;
const allHooks = [];

for (const path of files(ROOT)) {
  const text = readFileSync(path, "utf8");
  const { output, changed, hooks } = doProcess(path, text);

  allHooks.push(...hooks);

  if (!changed) continue;

  touched++;

  if (check) {
    console.error(`  sem gancho: ${relative(ROOT, path)}`);
  } else if (!soList) {
    writeFileSync(path, output);
  }
}

if (check) {
  if (touched) {
    console.error(`\n${touched} arquivo(s) fora de dia. Rode: yarn ganchos\n`);
    process.exit(1);
  }

  console.log(`ganchos em dia — ${allHooks.length} no app`);
} else {
  if (!soList) console.log(`${touched} arquivo(s) atualizados`);

  writeFileSync(LIST, `${JSON.stringify([...new Set(allHooks)].sort(), null, 2)}\n`);
  console.log(`${allHooks.length} ganchos · lista em ${relative(ROOT, LIST)}`);
}
