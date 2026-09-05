"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

const NIVEL: Record<string, string> = { H1: "# ", H2: "## ", H3: "### " };

const emMarkdown = (raiz: Element) => {
  const linhas: string[] = [];

  const visitar = (no: Element) => {
    if (no.tagName === "PRE") {
      linhas.push("```", no.textContent?.trim() ?? "", "```");
      return;
    }

    if (no.tagName in NIVEL) {
      linhas.push(`${NIVEL[no.tagName]}${no.textContent?.replace(/#$/, "").trim()}`);
      return;
    }

    if (no.tagName === "P" || no.tagName === "LI") {
      const texto = no.textContent?.trim();
      if (texto) linhas.push(no.tagName === "LI" ? `- ${texto}` : texto);
      return;
    }

    for (const filho of no.children) visitar(filho);
  };

  visitar(raiz);

  return linhas.join("\n\n");
};

export const CopiarPagina = () => {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    const artigo = document.querySelector("article");
    if (!artigo) return;

    await navigator.clipboard.writeText(`${emMarkdown(artigo)}\n\n${window.location.href}\n`);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={copiar}
      title="Copia a página como Markdown, pra colar num assistente"
      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-surface-1 px-3 py-1.5 text-xs text-ink-muted transition hover:bg-surface-2 hover:text-ink"
    >
      {copiado ? <Check className="size-3.5 text-online" /> : <Copy className="size-3.5" />}
      {copiado ? "Copiada" : "Copiar página"}
    </button>
  );
};
