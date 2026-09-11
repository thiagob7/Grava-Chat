import type { HLJSApi } from "highlight.js";

let loading: Promise<HLJSApi> | null = null;

export function loadHighlight(): Promise<HLJSApi> {
  loading ??= import("highlight.js/lib/common").then((m) => m.default);

  return loading;
}

export const LANGUAGE_AUTOMATIC = "auto";

export interface CodeLanguage {
  id: string;
  label: string;
  format?: string;
}

export const LANGUAGES: CodeLanguage[] = [
  { id: LANGUAGE_AUTOMATIC, label: "auto" },
  { id: "bash", label: "bash", format: "SHELL" },
  { id: "c", label: "c" },
  { id: "cpp", label: "cpp", format: "C++" },
  { id: "csharp", label: "csharp", format: "C#" },
  { id: "css", label: "css" },
  { id: "diff", label: "diff" },
  { id: "go", label: "go" },
  { id: "graphql", label: "graphql" },
  { id: "ini", label: "ini", format: "TOML" },
  { id: "java", label: "java" },
  { id: "javascript", label: "javascript", format: "JS" },
  { id: "json", label: "json" },
  { id: "kotlin", label: "kotlin" },
  { id: "less", label: "less" },
  { id: "lua", label: "lua" },
  { id: "makefile", label: "makefile" },
  { id: "markdown", label: "markdown", format: "MD" },
  { id: "objectivec", label: "objectivec", format: "OBJ-C" },
  { id: "perl", label: "perl" },
  { id: "php", label: "php" },
  { id: "plaintext", label: "plaintext", format: "TEXTO" },
  { id: "python", label: "python", format: "PY" },
  { id: "r", label: "r" },
  { id: "ruby", label: "ruby", format: "RB" },
  { id: "rust", label: "rust", format: "RS" },
  { id: "scss", label: "scss" },
  { id: "shell", label: "shell" },
  { id: "sql", label: "sql" },
  { id: "swift", label: "swift" },
  { id: "typescript", label: "typescript", format: "TS" },
  { id: "vbnet", label: "vbnet" },
  { id: "wasm", label: "wasm" },
  { id: "xml", label: "xml", format: "HTML" },
  { id: "yaml", label: "yaml", format: "YML" },
];

const NICKNAMES: Record<string, string> = {
  "c++": "cpp",
  "c#": "csharp",
  cs: "csharp",
  html: "xml",
  js: "javascript",
  jsx: "javascript",
  kt: "kotlin",
  md: "markdown",
  "objective-c": "objectivec",
  py: "python",
  rb: "ruby",
  rs: "rust",
  sh: "bash",
  toml: "ini",
  ts: "typescript",
  tsx: "typescript",
  yml: "yaml",
  zsh: "bash",
};

const KNOWN = new Set(LANGUAGES.map((i) => i.id));

export function normalizeLanguage(raw: string | null | undefined): string {
  const key = raw?.trim().toLowerCase();
  if (!key) return LANGUAGE_AUTOMATIC;

  const resolved = NICKNAMES[key] ?? key;

  return KNOWN.has(resolved) ? resolved : LANGUAGE_AUTOMATIC;
}

export interface Highlight {
  html: string;
  language: string | null;
}

export async function highlight(code: string, language: string): Promise<Highlight> {
  const hljs = await loadHighlight();

  if (language !== LANGUAGE_AUTOMATIC && hljs.getLanguage(language)) {
    const { value } = hljs.highlight(code, { language: language, ignoreIllegals: true });
    return { html: value, language };
  }

  const automatic = hljs.highlightAuto(code);

  return { html: automatic.value, language: automatic.language ?? null };
}
