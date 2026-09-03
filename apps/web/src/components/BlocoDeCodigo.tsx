import React, { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

import { rotuloDaLingua } from "~/lib/codigo";
import { copiarTexto } from "~/lib/copiar";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

interface BlocoDeCodigoProps {
  codigo: string;
  lingua?: string | null;
  className?: string;
}

export const BlocoDeCodigo: React.FC<BlocoDeCodigoProps> = ({
  codigo,
  lingua,
  className,
}) => {
  const { t } = useTranslation();
  const [copiado, setCopiado] = useState(false);
  const relogio = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(relogio.current), []);

  const copiar = async () => {
    if (!(await copiarTexto(codigo))) return;

    setCopiado(true);
    clearTimeout(relogio.current);
    relogio.current = setTimeout(() => setCopiado(false), 1600);
  };

  return (
    <div
      className={cn(
        "my-1 overflow-hidden rounded-md border border-line bg-codigo-bloco text-ink",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-line bg-codigo px-3 py-1">
        <span className="text-11 font-medium uppercase tracking-wide text-ink-faint">
          {rotuloDaLingua(lingua)}
        </span>

        <button
          type="button"
          onClick={copiar}
          aria-label={t(copiado ? "conversa.codigo.copiadoAria" : "conversa.codigo.copiarAria")}
          className="flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-11 text-ink-faint transition hover:bg-hover hover:text-ink"
        >
          {copiado ? <Check size={12} /> : <Copy size={12} />}
          {t(copiado ? "conversa.codigo.copiado" : "conversa.codigo.copiar")}
        </button>
      </div>

      {/*
        `whitespace-pre` de novo aqui porque a mensagem inteira vem com
        `whitespace-pre-wrap`: sem isso a linha longa quebra sozinha e o
        recuo do código some. Quebrar é papel da barra de rolagem.
      */}
      <pre className="overflow-x-auto px-3 py-2">
        <code className="whitespace-pre font-mono text-13 leading-relaxed">
          {codigo}
        </code>
      </pre>
    </div>
  );
};
