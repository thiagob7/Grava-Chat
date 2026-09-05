import type { HLJSApi } from "highlight.js";

/*
  O highlight.js entra por import dinâmico: são ~120 KB que só interessam a
  quem abre uma conversa com código, e não a quem só está lendo texto. O
  módulo fica em cache depois da primeira vez.
*/
let carregando: Promise<HLJSApi> | null = null;

export function carregarRealce(): Promise<HLJSApi> {
  carregando ??= import("highlight.js/lib/common").then((m) => m.default);

  return carregando;
}

/// O que o seletor de idioma oferece. `auto` deixa o próprio highlight.js
/// decidir, que é o padrão de quem cola sem dizer a linguagem.
export const IDIOMA_AUTOMATICO = "auto";

export interface IdiomaDeCodigo {
  id: string;
  rotulo: string;
  /// O nome do formato quando ele difere do id, como o Fluxer mostra em
  /// cinza ao lado (`adoc  ASCIIDOC`).
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

/// Os apelidos que a cerca costuma trazer, para cair no id que o
/// highlight.js conhece.
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

/*
  Normaliza o que veio da cerca. Devolve `auto` quando não reconhece, em vez de
  inventar: melhor o highlight.js chutar do que pintar com a gramática errada.

  `txt` de propósito não vira `plaintext`: um .txt costuma ter código dentro, e
  a gramática de texto puro desligaria o realce justamente onde ele ajuda.
  Quem quiser texto cru escolhe `plaintext` na lista.
*/
export function normalizarIdioma(bruto: string | null | undefined): string {
  const chave = bruto?.trim().toLowerCase();
  if (!chave) return IDIOMA_AUTOMATICO;

  const resolvido = APELIDOS[chave] ?? chave;

  return CONHECIDOS.has(resolvido) ? resolvido : IDIOMA_AUTOMATICO;
}

export interface Realce {
  html: string;
  /// Qual gramática acabou sendo usada — o `auto` precisa disto para o
  /// rodapé mostrar o que ele decidiu.
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
