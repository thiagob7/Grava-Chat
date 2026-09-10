import React, { useEffect, useRef, useState } from "react";

import { useTema } from "~/@core/application/queries/tema/use-temas";
import { MOTORES, NOME_DA_VARIAVEL } from "~/features/tema/lib/fundos";
import { documentoDaPrevia } from "~/features/tema/lib/previa-do-tema";
import { cn } from "~/lib/utils";

/*
  A prévia roda sem script, então o motor de fundo não desenha nada nela. Em
  vez de deixar o tema parecer mais pobre do que é, o cartão diz que existe
  um motor e qual.
*/
const PEDIDO = new RegExp(`${NOME_DA_VARIAVEL}\\s*:\\s*["']?([a-z0-9-]+)`, "i");

function motorDeclarado(css: string): string | null {
  const achado = PEDIDO.exec(css)?.[1];
  return achado && achado in MOTORES ? achado : null;
}

const LARGURA = 640;
const ALTURA = 360;

/*
  A galeria não carrega o CSS de todo mundo: a lista vem sem ele de propósito,
  porque um tema pesa e são dezenas na tela. Cada cartão busca o seu só quando
  chega perto da janela, e o cache do TanStack cuida de não pedir duas vezes.
*/
function useApareceu<T extends HTMLElement>() {
  const alvo = useRef<T>(null);
  const [apareceu, setApareceu] = useState(false);
  const [largura, setLargura] = useState(0);

  useEffect(() => {
    const elemento = alvo.current;
    if (!elemento) return;

    const regua = new ResizeObserver(([entrada]) => {
      const medida = entrada?.contentRect.width ?? 0;
      if (medida) setLargura(medida);
    });

    regua.observe(elemento);

    if (apareceu) return () => regua.disconnect();

    const olho = new IntersectionObserver(
      ([entrada]) => entrada?.isIntersecting && setApareceu(true),
      { rootMargin: "200px" },
    );

    olho.observe(elemento);

    return () => {
      olho.disconnect();
      regua.disconnect();
    };
  }, [apareceu]);

  return { alvo, apareceu, largura };
}

export const PreviaDoTema: React.FC<{
  temaId: string;
  className?: string;
}> = ({ temaId, className }) => {
  const { alvo, apareceu, largura } = useApareceu<HTMLDivElement>();
  const { data: tema } = useTema(apareceu ? temaId : undefined);
  const escala = largura ? largura / LARGURA : 0;
  const motor = tema ? motorDeclarado(tema.css) : null;

  return (
    <div
      data-gc="tema.previa-do-tema.div"
      ref={alvo}
      className={cn("relative overflow-hidden bg-surface-3", className)}
    >
      {tema && escala > 0 && (
        <iframe
          data-gc="tema.previa-do-tema.iframe"
          title={`Prévia de ${tema.nome}`}
          sandbox=""
          loading="lazy"
          tabIndex={-1}
          aria-hidden
          srcDoc={documentoDaPrevia(tema.css, tema.substituicoes)}
          /*
            O iframe é desenhado grande e encolhido: em tamanho de cartão o
            texto do app viraria borrão, e o que a pessoa quer ver é o
            desenho, não ler a conversa de mentira.
          */
          style={{
            width: LARGURA,
            height: ALTURA,
            transform: `scale(${escala})`,
            transformOrigin: "top left",
          }}
          className="pointer-events-none absolute left-0 top-0 border-0"
        />
      )}

      {motor && (
        <span
          data-gc="tema.previa-do-tema.span"
          title="A prévia não roda o motor. Instale para ver."
          className="absolute left-1.5 top-1.5 rounded bg-surface-0/85 px-1.5 py-0.5 text-10 font-medium text-ink backdrop-blur-sm"
        >
          {motor} animado
        </span>
      )}
    </div>
  );
};
