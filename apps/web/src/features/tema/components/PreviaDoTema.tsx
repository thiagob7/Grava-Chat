import React, { useEffect, useMemo, useRef, useState } from "react";

import { useTheme } from "~/@core/application/queries/tema/use-temas";
import { ENGINES, VARIABLE_NAME } from "~/features/tema/lib/fundos";
import { previewDocument } from "~/features/tema/lib/previa-do-tema";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

/*
  A prévia roda sem script, então o motor de fundo não desenha nada nela. Em
  vez de deixar o tema parecer mais pobre do que é, o cartão diz que existe
  um motor e qual.
*/
const REQUEST = new RegExp(`${VARIABLE_NAME}\\s*:\\s*["']?([a-z0-9-]+)`, "i");

function motorDeclared(css: string): string | null {
  const match = REQUEST.exec(css)?.[1];
  return match && match in ENGINES ? match : null;
}

const WIDTH = 640;
const HEIGHT = 360;

/*
  Uma prévia monta de cada vez.

  Cada uma é um documento inteiro, com o CSS do tema para o navegador ler. A
  galeria punha todas na tela juntas e o navegador processava tudo no mesmo
  instante, e a tela travava. Na fila, a próxima só começa quando a anterior
  terminou de carregar — ou num tempo curto, para um tema quebrado não segurar
  as outras.
*/
const TURN_MS = 600;
const waiting: (() => void)[] = [];
let busy = false;

function nextTurn() {
  const start = waiting.shift();
  busy = Boolean(start);
  start?.();
}

function useTurn(wants: boolean) {
  const [turn, setTurn] = useState(false);
  const release = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!wants) return;

    let released = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const free = () => {
      if (released) return;
      released = true;
      clearTimeout(timer);
      release.current = null;
      nextTurn();
    };

    const start = () => {
      release.current = free;
      timer = setTimeout(free, TURN_MS);
      setTurn(true);
    };

    if (busy) waiting.push(start);
    else {
      busy = true;
      start();
    }

    return () => {
      const index = waiting.indexOf(start);
      if (index >= 0) waiting.splice(index, 1);
      else free();
      setTurn(false);
    };
  }, [wants]);

  return { turn, loaded: () => release.current?.() };
}

/*
  A galeria não carrega o CSS de todo mundo: a lista vem sem ele de propósito,
  porque um tema pesa e são dezenas na tela. Cada cartão busca o seu só quando
  chega perto da janela, e o cache do TanStack cuida de não pedir duas vezes.
*/
const NEAR_MARGIN = "300px";

function useAppeared<T extends HTMLElement>() {
  const target = useRef<T>(null);
  const [appeared, setAppeared] = useState(false);
  const [near, setNear] = useState(false);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = target.current;
    if (!element) return;

    const slider = new ResizeObserver(([entry]) => {
      const measure = entry?.contentRect.width ?? 0;
      if (measure) setWidth(measure);
    });

    const eye = new IntersectionObserver(
      ([entry]) => {
        const inside = Boolean(entry?.isIntersecting);
        setNear(inside);
        if (inside) setAppeared(true);
      },
      { rootMargin: NEAR_MARGIN },
    );

    slider.observe(element);
    eye.observe(element);

    return () => {
      eye.disconnect();
      slider.disconnect();
    };
  }, []);

  return { target, appeared, near, width };
}

export const ThemePreview: React.FC<{
  themeId: string;
  className?: string;
  /* Congela as animações do tema. Para galerias, onde há muitas prévias juntas. */
  still?: boolean;
}> = ({ themeId, className, still = false }) => {
  const { t } = useTranslation();
  const { target, appeared, near, width } = useAppeared<HTMLDivElement>();
  const { data: theme } = useTheme(appeared ? themeId : undefined);
  const scale = width ? width / WIDTH : 0;
  const { turn, loaded } = useTurn(Boolean(theme && scale > 0 && near));
  const documentHtml = useMemo(
    () => (theme ? previewDocument(theme.css, theme.overrides, { still }) : ""),
    [theme, still],
  );
  const motor = theme ? motorDeclared(theme.css) : null;

  return (
    <div
      data-gc="tema.previa-do-tema.div"
      ref={target}
      className={cn("relative overflow-hidden bg-surface-3", className)}
    >
      {theme && scale > 0 && near && turn && (
        <iframe
          data-gc="tema.previa-do-tema.iframe.loaded"
          title={`Prévia de ${theme.name}`}
          sandbox=""
          loading="lazy"
          tabIndex={-1}
          aria-hidden
          srcDoc={documentHtml}
          onLoad={loaded}
          /*
            O iframe é desenhado grande e encolhido: em tamanho de cartão o
            texto do app viraria borrão, e o que a pessoa quer ver é o
            desenho, não ler a conversa de mentira.
          */
          style={{
            width: WIDTH,
            height: HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
          className="pointer-events-none absolute left-0 top-0 border-0"
        />
      )}

      {motor && (
        <span
          data-gc="tema.previa-do-tema.span"
          title={t("configuracoes.tema.previaSemMotor")}
          className="absolute left-1.5 top-1.5 rounded bg-surface-0/85 px-1.5 py-0.5 text-10 font-medium text-ink backdrop-blur-sm"
        >
          {t("configuracoes.tema.motorAnimado", { motor })}
        </span>
      )}
    </div>
  );
};
