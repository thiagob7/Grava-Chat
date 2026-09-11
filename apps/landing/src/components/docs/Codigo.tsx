"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

type Props = {
  children: string;
  legenda?: string;
};

export const Code = ({ children, legenda }: Props) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <figure className="my-5 overflow-hidden rounded-xl border border-line bg-surface-1">
      <div className="flex items-center gap-3 border-b border-line/70 px-4 py-2">
        <span className="text-xs text-ink-faint">{legenda ?? "terminal"}</span>

        <button
          type="button"
          onClick={copy}
          className="ml-auto flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-ink-muted transition hover:bg-surface-3 hover:text-ink"
        >
          {copied ? <Check className="size-3.5 text-online" /> : <Copy className="size-3.5" />}
          {copied ? "copiado" : "copiar"}
        </button>
      </div>

      <pre className="overflow-x-auto px-4 py-3.5 text-[13px] leading-relaxed">
        <code>{children}</code>
      </pre>
    </figure>
  );
};
