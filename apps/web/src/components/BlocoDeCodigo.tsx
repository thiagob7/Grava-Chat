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
      <div className="border-b border-line bg-codigo px-3 py-1">
        <span className="text-11 font-medium uppercase tracking-wide text-ink-faint">
          {rotuloDaLingua(lingua)}
        </span>
      </div>

      {/*
        O botão de copiar mora DENTRO do código, e não no cabeçalho, por causa
        da barra de ações da mensagem.

        Ela é `absolute -top-3` com uns 32px de altura, então ocupa de −12px a
        +20px do topo da mensagem. O bloco começa em +4 e o cabeçalho vai até
        +28 — ou seja, o cabeçalho inteiro nasce debaixo dela, e com ele o
        botão. Numa mensagem agrupada, onde não há linha de nome para servir de
        colchão, era impossível clicar em copiar: o clique caía na barra.

        Mover para a esquerda do cabeçalho não resolveria. A barra é alinhada à
        direita mas cresce até `calc(100% - 1rem)`, então numa coluna estreita —
        o painel da voz tem 280px — ela cobre a linha toda. O que resolve é
        DESCER: o `<pre>` começa em +28, já fora do alcance dela.

        Fica sempre visível, e não só no `hover`. Um botão que aparece ao passar
        o mouse não existe no toque, e o celular é justamente onde copiar código
        à mão é mais penoso.
      */}
      <div className="relative">
        <button
          type="button"
          onClick={copiar}
          aria-label={t(copiado ? "conversa.codigo.copiadoAria" : "conversa.codigo.copiarAria")}
          /*
            O fundo é opaco porque ele pousa sobre a primeira linha de código.
            Translúcido, o texto passava por baixo e as duas coisas viravam
            ilegíveis juntas.
          */
          className="absolute right-2 top-2 z-[1] flex shrink-0 items-center gap-1 rounded border border-line bg-codigo px-1.5 py-0.5 text-11 text-ink-faint transition hover:bg-hover hover:text-ink"
        >
          {copiado ? <Check size={12} /> : <Copy size={12} />}
          {t(copiado ? "conversa.codigo.copiado" : "conversa.codigo.copiar")}
        </button>

        {/*
          `whitespace-pre` de novo aqui porque a mensagem inteira vem com
          `whitespace-pre-wrap`: sem isso a linha longa quebra sozinha e o
          recuo do código some. Quebrar é papel da barra de rolagem.

          O `pr` reserva a largura do botão na PRIMEIRA linha — sem ele, um
          código cuja primeira linha é longa passava por baixo dele.
        */}
        <pre className="overflow-x-auto px-3 py-2 pr-24">
          <code className="whitespace-pre font-mono text-13 leading-relaxed">
            {codigo}
          </code>
        </pre>
      </div>
    </div>
  );
};
