import React, { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

import { Tooltip } from "~/components/ui/tooltip";
import { adivinharLingua } from "~/features/conversa/lib/codigo";
import { normalizarIdioma, realcar } from "~/features/conversa/lib/realce";
import { copiarTexto } from "~/lib/copiar";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

interface BlocoDeCodigoProps {
  codigo: string;
  lingua?: string | null;
  className?: string;
}

/*
  O bloco no meio da mensagem é só o código: realce e um botão de copiar no
  canto. Rodapé com nome, tamanho e seletor de idioma é coisa de ANEXO — ver
  PreviaDeTexto. Aqui não há arquivo nenhum para nomear.
*/
export const BlocoDeCodigo: React.FC<BlocoDeCodigoProps> = ({
  codigo,
  lingua,
  className,
}) => {
  const { t } = useTranslation();
  const [copiado, setCopiado] = useState(false);
  const [html, setHtml] = useState<string | null>(null);
  const relogio = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(relogio.current), []);

  useEffect(() => {
    let vivo = true;

    void realcar(codigo, normalizarIdioma(lingua ?? adivinharLingua(codigo)))
      .then((realce) => vivo && setHtml(realce.html))
      .catch(() => undefined);

    return () => {
      vivo = false;
    };
  }, [codigo, lingua]);

  const copiar = async () => {
    if (!(await copiarTexto(codigo))) return;

    setCopiado(true);
    clearTimeout(relogio.current);
    relogio.current = setTimeout(() => setCopiado(false), 1600);
  };

  return (
    <div
      className={cn(
        "relative my-1 overflow-hidden rounded-md border border-line bg-codigo-bloco text-ink",
        className,
      )}
    >
      <pre className="overflow-x-auto py-2 pl-3 pr-12 font-mono text-13 leading-relaxed">
        {html ? (
          <code className="hljs" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <code className="whitespace-pre">{codigo}</code>
        )}
      </pre>

      <Tooltip label={t(copiado ? "conversa.codigo.copiado" : "conversa.codigo.copiar")}>
        <button
          type="button"
          onClick={copiar}
          aria-label={t(
            copiado ? "conversa.codigo.copiadoAria" : "conversa.codigo.copiarAria",
          )}
          className="absolute right-2 top-2 z-[1] flex size-7 items-center justify-center rounded border border-line bg-codigo text-ink-faint transition hover:bg-hover hover:text-ink"
        >
          {copiado ? <Check size={14} className="text-online" /> : <Copy size={14} />}
        </button>
      </Tooltip>
    </div>
  );
};
