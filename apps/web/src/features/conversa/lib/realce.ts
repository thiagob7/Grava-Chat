import type { HLJSApi } from "highlight.js";

let carregando: Promise<HLJSApi> | null = null;

export function carregarRealce(): Promise<HLJSApi> {
  carregando ??= import("highlight.js/lib/common").then((m) => m.default);

  return carregando;
}

export const IDIOMA_AUTOMATICO = "auto";

export interface IdiomaDeCodigo {
  id: string;
  rotulo: string;
  formato?: string;
}

export const IDIOMAS: IdiomaDeCodigo[] = [
  { id: IDIOMA_AUTOMATICO, rotulo: "auto" },
  { id: "bash", rotulo: "bash", formato: "SHELL" },
  { id: "c", rotulo: "c" },
  { id: "cpp", rotulo: "cpp", formato: "C++" },
  { id: "csharp", rotulo: "csharp", formato: "C#" },
  { id: "css", rotulo: "css" },
  { id: "diff", rotulo: "diff" },
  { id: "go", rotulo: "go" },
  { id: "graphql", rotulo: "graphql" },
  { id: "ini", rotulo: "ini", formato: "TOML" },
  { id: "java", rotulo: "java" },
  { id: "javascript", rotulo: "javascript", formato: "JS" },
  { id: "json", rotulo: "json" },
  { id: "kotlin", rotulo: "kotlin" },
  { id: "less", rotulo: "less" },
  { id: "lua", rotulo: "lua" },
  { id: "makefile", rotulo: "makefile" },
  { id: "markdown", rotulo: "markdown", formato: "MD" },
  { id: "objectivec", rotulo: "objectivec", formato: "OBJ-C" },
  { id: "perl", rotulo: "perl" },
  { id: "php", rotulo: "php" },
  { id: "plaintext", rotulo: "plaintext", formato: "TEXTO" },
  { id: "python", rotulo: "python", formato: "PY" },
  { id: "r", rotulo: "r" },
  { id: "ruby", rotulo: "ruby", formato: "RB" },
  { id: "rust", rotulo: "rust", formato: "RS" },
  { id: "scss", rotulo: "scss" },
  { id: "shell", rotulo: "shell" },
  { id: "sql", rotulo: "sql" },
  { id: "swift", rotulo: "swift" },
  { id: "typescript", rotulo: "typescript", formato: "TS" },
  { id: "vbnet", rotulo: "vbnet" },
  { id: "wasm", rotulo: "wasm" },
  { id: "xml", rotulo: "xml", formato: "HTML" },
  { id: "yaml", rotulo: "yaml", formato: "YML" },
];

const APELIDOS: Record<string, string> = {
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

const CONHECIDOS = new Set(IDIOMAS.map((i) => i.id));

export function normalizarIdioma(bruto: string | null | undefined): string {
  const chave = bruto?.trim().toLowerCase();
  if (!chave) return IDIOMA_AUTOMATICO;

  const resolvido = APELIDOS[chave] ?? chave;

  return CONHECIDOS.has(resolvido) ? resolvido : IDIOMA_AUTOMATICO;
}

export interface Realce {
  html: string;
  idioma: string | null;
}

export async function realcar(codigo: string, idioma: string): Promise<Realce> {
  const hljs = await carregarRealce();

  if (idioma !== IDIOMA_AUTOMATICO && hljs.getLanguage(idioma)) {
    const { value } = hljs.highlight(codigo, { language: idioma, ignoreIllegals: true });
    return { html: value, idioma };
  }

  const automatico = hljs.highlightAuto(codigo);

  return { html: automatico.value, idioma: automatico.language ?? null };
}
