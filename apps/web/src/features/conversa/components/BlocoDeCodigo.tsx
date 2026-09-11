import React, { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

import { Tooltip } from "~/components/ui/tooltip";
import { guessLanguage } from "~/features/conversa/lib/codigo";
import { normalizeLanguage, highlight } from "~/features/conversa/lib/realce";
import { copyText } from "~/lib/copiar";
import { cn } from "~/lib/utils";
import { flxAttr, flxCls } from "~/lib/compat-de-tema";
import { useTranslation } from "~/traducao";

interface CodePropsBlock {
  code: string;
  language?: string | null;
  className?: string;
}

export const CodeBlock: React.FC<CodePropsBlock> = ({
  code,
  language,
  className,
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [html, setHtml] = useState<string | null>(null);
  const clock = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(clock.current), []);

  useEffect(() => {
    let live = true;

    void highlight(code, normalizeLanguage(language ?? guessLanguage(code)))
      .then((highlight) => live && setHtml(highlight.html))
      .catch(() => undefined);

    return () => {
      live = false;
    };
  }, [code, language]);

  const copy = async () => {
    if (!(await copyText(code))) return;

    setCopied(true);
    clearTimeout(clock.current);
    clock.current = setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div data-gc="conversa.bloco-de-codigo.div"
      {...flxAttr("codeBlock")}
      className={cn(
        flxCls("codeBlock"),
        "relative my-1 overflow-hidden rounded-md border border-line bg-codigo-bloco text-ink",
        className,
      )}
    >
      <pre data-gc="conversa.bloco-de-codigo.pre" className="overflow-x-auto py-2 pl-3 pr-12 font-mono text-13 leading-relaxed">
        {html ? (
          <code data-gc="conversa.bloco-de-codigo.code" className="hljs" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <code data-gc="conversa.bloco-de-codigo.code--2" className="whitespace-pre">{code}</code>
        )}
      </pre>

      <Tooltip data-gc="conversa.bloco-de-codigo.tooltip" label={t(copied ? "conversa.codigo.copiado" : "conversa.codigo.copiar")}>
        <button data-gc="conversa.bloco-de-codigo.button.copy"
          type="button"
          onClick={copy}
          aria-label={t(
            copied ? "conversa.codigo.copiadoAria" : "conversa.codigo.copiarAria",
          )}
          className={cn("absolute right-2 top-2 z-[1] flex size-7 items-center justify-center rounded border border-line bg-codigo text-ink-faint transition hover:bg-hover hover:text-ink", flxCls("codeActions"))}
        >
          {copied ? <Check data-gc="conversa.bloco-de-codigo.check" size={14} className="text-online" /> : <Copy data-gc="conversa.bloco-de-codigo.copy" size={14} />}
        </button>
      </Tooltip>
    </div>
  );
};
