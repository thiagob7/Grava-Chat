import type { Attachment } from "@gravae/shared";

/// Acima disto não vale a pena baixar o arquivo só para mostrar as primeiras
/// linhas: o cartão vira um anexo comum, com o botão de baixar.
export const MAIOR_PREVIA_BYTES = 512 * 1024;

const TIPOS = [
  "text/",
  "application/json",
  "application/xml",
  "application/javascript",
  "application/typescript",
  "application/x-sh",
  "application/x-yaml",
];

const EXTENSOES = new Set([
  "c",
  "cfg",
  "conf",
  "cpp",
  "cs",
  "css",
  "diff",
  "env",
  "go",
  "gradle",
  "h",
  "htm",
  "html",
  "ini",
  "java",
  "js",
  "json",
  "jsx",
  "kt",
  "less",
  "log",
  "lua",
  "md",
  "mjs",
  "patch",
  "php",
  "pl",
  "prisma",
  "py",
  "rb",
  "rs",
  "scss",
  "sh",
  "sql",
  "svg",
  "swift",
  "toml",
  "ts",
  "tsx",
  "txt",
  "vue",
  "xml",
  "yaml",
  "yml",
  "zsh",
]);

/// Arquivo sem ponto no nome não tem extensão — `split(".").pop()` devolveria
/// o nome inteiro e faria "Dockerfile" virar a extensão "dockerfile".
export function extensaoDe(nome: string): string {
  const ponto = nome.lastIndexOf(".");

  return ponto <= 0 ? "" : nome.slice(ponto + 1).toLowerCase();
}

/// Vale a prévia com realce? Olha o tipo declarado e, quando ele vem
/// genérico demais, o próprio nome do arquivo.
export function ehAnexoDeTexto(anexo: Attachment): boolean {
  if (anexo.size > MAIOR_PREVIA_BYTES) return false;

  const tipo = anexo.contentType.toLowerCase();
  if (TIPOS.some((t) => tipo.startsWith(t))) return true;

  return EXTENSOES.has(extensaoDe(anexo.filename));
}
