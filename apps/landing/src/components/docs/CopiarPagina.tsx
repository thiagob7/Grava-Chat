"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

const LEVEL: Record<string, string> = { H1: "# ", H2: "## ", H3: "### " };

const inMarkdown = (root: Element) => {
  const lines: string[] = [];

  const visit = (no: Element) => {
    if (no.tagName === "PRE") {
      lines.push("```", no.textContent?.trim() ?? "", "```");
      return;
    }

    if (no.tagName in LEVEL) {
      lines.push(`${LEVEL[no.tagName]}${no.textContent?.replace(/#$/, "").trim()}`);
      return;
    }

    if (no.tagName === "P" || no.tagName === "LI") {
      const text = no.textContent?.trim();
      if (text) lines.push(no.tagName === "LI" ? `- ${text}` : text);
      return;
    }

    for (const child of no.children) visit(child);
  };

  visit(root);

  return lines.join("\n\n");
};

export const CopyPage = () => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const article = document.querySelector("article");
    if (!article) return;

    await navigator.clipboard.writeText(`${inMarkdown(article)}\n\n${window.location.href}\n`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={copy}
      title="Copia a página como Markdown, pra colar num assistente"
      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-surface-1 px-3 py-1.5 text-xs text-ink-muted transition hover:bg-surface-2 hover:text-ink"
    >
      {copied ? <Check className="size-3.5 text-online" /> : <Copy className="size-3.5" />}
      {copied ? "Copiada" : "Copiar página"}
    </button>
  );
};
