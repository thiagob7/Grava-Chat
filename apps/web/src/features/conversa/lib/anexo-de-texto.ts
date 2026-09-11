import type { Attachment } from "@gravae/shared";

export const LARGER_PREVIEW_BYTES = 512 * 1024;

const KINDS = [
  "text/",
  "application/json",
  "application/xml",
  "application/javascript",
  "application/typescript",
  "application/x-sh",
  "application/x-yaml",
];

const EXTENSIONS = new Set([
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

export function extension(name: string): string {
  const dot = name.lastIndexOf(".");

  return dot <= 0 ? "" : name.slice(dot + 1).toLowerCase();
}

export function isTextAttachment(attachment: Attachment): boolean {
  if (attachment.size > LARGER_PREVIEW_BYTES) return false;

  const kind = attachment.contentType.toLowerCase();
  if (KINDS.some((t) => kind.startsWith(t))) return true;

  return EXTENSIONS.has(extension(attachment.filename));
}
