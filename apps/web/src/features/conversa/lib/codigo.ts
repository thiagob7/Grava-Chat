const FENCE = /```([^\n`]*)\n?([\s\S]*?)```/g;
const IN_LINE = /`([^`\n]*[^\s`][^`\n]*)`/g;

export type Piece =
  | { kind: "texto"; text: string }
  | { kind: "linha"; code: string }
  | { kind: "bloco"; code: string; language: string | null };

export function fromCode(content: string): Piece[] {
  const pieces: Piece[] = [];
  let last = 0;

  for (const match of content.matchAll(FENCE)) {
    if (match.index === undefined) continue;

    const [whole, report, body] = match;
    const code = (body ?? "").replace(/\n$/, "");

    if (!code.trim()) continue;

    if (match.index > last) {
      pieces.push(...inLine(content.slice(last, match.index)));
    }

    pieces.push({ kind: "bloco", code, language: firstWord(report) });
    last = match.index + whole.length;
  }

  if (last < content.length) pieces.push(...inLine(content.slice(last)));

  return pieces;
}

function inLine(snippet: string): Piece[] {
  const pieces: Piece[] = [];
  let last = 0;

  for (const match of snippet.matchAll(IN_LINE)) {
    if (match.index === undefined) continue;

    if (match.index > last) {
      pieces.push({ kind: "texto", text: snippet.slice(last, match.index) });
    }

    pieces.push({ kind: "linha", code: match[1] ?? "" });
    last = match.index + match[0].length;
  }

  if (last < snippet.length) pieces.push({ kind: "texto", text: snippet.slice(last) });

  return pieces;
}

function firstWord(report: string | undefined): string | null {
  return (report ?? "").trim().split(/\s+/)[0] || null;
}

const LANGUAGES: Record<string, string> = {
  bash: "Bash",
  c: "C",
  cpp: "C++",
  cs: "C#",
  css: "CSS",
  diff: "Diff",
  go: "Go",
  html: "HTML",
  java: "Java",
  javascript: "JavaScript",
  js: "JavaScript",
  json: "JSON",
  jsx: "JSX",
  kt: "Kotlin",
  markdown: "Markdown",
  md: "Markdown",
  php: "PHP",
  py: "Python",
  python: "Python",
  rb: "Ruby",
  rs: "Rust",
  rust: "Rust",
  sh: "Shell",
  shell: "Shell",
  sql: "SQL",
  swift: "Swift",
  ts: "TypeScript",
  tsx: "TSX",
  typescript: "TypeScript",
  xml: "XML",
  yaml: "YAML",
  yml: "YAML",
  zsh: "Shell",
};

export function languageLabel(language: string | null | undefined): string {
  const key = language?.trim().toLowerCase();
  if (!key) return "Código";

  return LANGUAGES[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

const RESERVED =
  /^[ \t]*(import|export|from|const|let|var|function|class|def|return|public|private|static|package|using|#include|#!|SELECT|INSERT|UPDATE|DELETE|CREATE|npm|yarn|pnpm|git|docker|sudo|apt|brew|curl|cd|mkdir|chmod)\b/i;

const ASSIGNMENT = /^[ \t]*[\w.$"'[\]-]+[ \t]*[:=][ \t]*\S/;

const SIGNALS: RegExp[] = [
  /[;{]\s*$/m,
  /=>|->|::|!==|===|\+=|\|\|/,
  /^[ \t]*(\/\/|#|\/\*|\*\s)/m,
  /\b[\w.$]+\([^)]*\)/,
  /<\/?[a-z][\w-]*(\s[^>]*)?\/?>/i,
  /\b[\w-]+\.(tsx?|jsx?|mjs|py|rb|go|rs|java|kt|php|css|json|html|yml|yaml):\d+/i,
];

function densityStructural(text: string): number {
  const useful = text.replace(/\s/g, "");
  if (!useful.length) return 0;

  return (useful.match(/[{}()[\]<>=;|&*/\\+]/g)?.length ?? 0) / useful.length;
}

export function looksCode(text: string): boolean {
  if (text.includes("```")) return false;

  const withoutLinks = text.replace(/https?:\/\/\S+/g, " ");
  const lines = withoutLinks.split("\n").filter((l) => l.trim());
  if (lines.length < 3) return false;

  const withReserved = lines.filter((l) => RESERVED.test(l)).length;
  const withAssignment = lines.filter((l) => ASSIGNMENT.test(l)).length;
  const indented = lines.filter((l) => /^[ \t]{2,}\S/.test(l)).length;
  const keysAlone = lines.filter((l) => /^[ \t]*[\w.-]+:[ \t]*$/.test(l)).length;
  const density = densityStructural(withoutLinks);

  const points =
    (withReserved >= 2 ? 3 : withReserved ? 2 : 0) +
    (withAssignment >= 3 ? 2 : withAssignment ? 1 : 0) +
    (density >= 0.08 ? 2 : density >= 0.04 ? 1 : 0) +
    (indented >= 2 ? 1 : 0) +
    (keysAlone >= 2 ? 1 : 0) +
    SIGNALS.filter((signal) => signal.test(withoutLinks)).length;

  return points >= 3;
}

export function guessLanguage(text: string): string | null {
  const t = text.trim();

  if (/^[[{]/.test(t)) {
    try {
      JSON.parse(t);
      return "json";
    } catch {
    }
  }

  if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE TABLE)\b/i.test(t)) return "sql";
  if (/^\s*<(\?xml|!doctype|html|div|span|section)\b/i.test(t)) return "html";

  if (/^\s*@(import|media|charset|font-face|keyframes|tailwind)\b/m.test(t)) return "css";
  if (/^\s*(#!|\$ )|^\s*(npm|yarn|pnpm|git|docker|cd|sudo|apt|brew|curl)\s/m.test(t)) return "sh";
  if (/^\s*(def|class)\s+\w+.*:\s*$/m.test(t) || /^\s*(from|import)\s+\w+\s*$/m.test(t)) return "py";

  if (/:\s*(string|number|boolean|void|any|unknown|Promise<)/.test(t)) return "ts";
  if (/\b(const|let|function|=>|import .* from|require\()/.test(t)) return "js";

  if (/(^|\})\s*[.#:a-z[][^{}\n=()]{0,120}\{[^}]*[a-z-]+\s*:[^;}]+[;}]/i.test(t)) {
    return "css";
  }

  return null;
}

export function surroundCode(text: string): string {
  const clean = text.replace(/\s+$/, "");

  return `\`\`\`${guessLanguage(clean) ?? ""}\n${clean}\n\`\`\``;
}

const EXTENSION: Record<string, string> = {
  bash: "sh",
  css: "css",
  html: "html",
  js: "js",
  json: "json",
  jsx: "jsx",
  md: "md",
  py: "py",
  rb: "rb",
  rs: "rs",
  sh: "sh",
  sql: "sql",
  ts: "ts",
  tsx: "tsx",
  xml: "xml",
  yaml: "yml",
  yml: "yml",
};

export interface TextFile {
  name: string;
  content: string;
}

export function textForFile(text: string, base = "mensagem"): TextFile {
  const pieces = fromCode(text).filter(
    (p) => p.kind !== "texto" || p.text.trim().length > 0,
  );

  const blocks = pieces.filter((p) => p.kind === "bloco");
  const soBlocks = blocks.length > 0 && blocks.length === pieces.length;

  if (!soBlocks) return { name: `${base}.txt`, content: text.trim() };

  const language = blocks.find((b) => b.language)?.language ?? guessLanguage(blocks[0]!.code);
  const extension = EXTENSION[(language ?? "").toLowerCase()] ?? "txt";

  return {
    name: `${base}.${extension}`,
    content: blocks.map((b) => b.code.trim()).join("\n\n"),
  };
}
