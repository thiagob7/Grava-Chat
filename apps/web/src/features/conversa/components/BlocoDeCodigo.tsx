import React, { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

import { rotuloDaLingua } from "~/features/conversa/lib/codigo";
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
      <div className="border-b border-line bg-codigo px-3 py-1">
        <span className="text-11 font-medium uppercase tracking-wide text-ink-faint">
          {rotuloDaLingua(lingua)}
        </span>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={copiar}
          aria-label={t(copiado ? "conversa.codigo.copiadoAria" : "conversa.codigo.copiarAria")}
          className="absolute right-2 top-2 z-[1] flex shrink-0 items-center gap-1 rounded border border-line bg-codigo px-1.5 py-0.5 text-11 text-ink-faint transition hover:bg-hover hover:text-ink"
        >
          {copiado ? <Check size={12} /> : <Copy size={12} />}
          {t(copiado ? "conversa.codigo.copiado" : "conversa.codigo.copiar")}
        </button>

        <pre className="overflow-x-auto px-3 py-2 pr-24">
          <code className="whitespace-pre font-mono text-13 leading-relaxed">
            {codigo}
          </code>
        </pre>
      </div>
    </div>
  );
};
