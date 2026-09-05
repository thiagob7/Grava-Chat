import React, { useEffect, useRef, useState } from "react";
import { Maximize2, Minus, X } from "lucide-react";

import { cn } from "~/lib/utils";
import {
  encaixarNaTela,
  geometriaGuardada,
  guardarGeometria,
  type Geometria,
} from "~/lib/geometria-de-janela";

/*
  Uma janela de verdade, dentro do app.

  Não é modal: não escurece nada e não tranca o que está atrás. Serve para o que
  a pessoa usa ao lado do app em vez de no lugar dele — o estúdio de temas, que
  só faz sentido com a tela mudando atrás enquanto se digita.

  Fica em z-40, abaixo dos nossos modais e menus, para os menus que a própria
  janela abre aparecerem por cima dela.
*/

const BARRA = 36;

interface JanelaFlutuanteProps {
  /// Distingue a geometria guardada de cada janela.
  id: string;
  titulo: string;
  aberto: boolean;
  onFechar: () => void;
  children: React.ReactNode;
}

export const JanelaFlutuante: React.FC<JanelaFlutuanteProps> = ({
  id,
  titulo,
  aberto,
  onFechar,
  children,
}) => {
  const [geometria, setGeometria] = useState<Geometria>(() => geometriaGuardada(id));
  const [encolhida, setEncolhida] = useState(false);
  const [cheia, setCheia] = useState(false);

  const arrasto = useRef<{ x: number; y: number; base: Geometria } | null>(null);

  useEffect(() => {
    if (!aberto) return;

    const reencaixar = () => setGeometria((atual) => encaixarNaTela(atual));

    window.addEventListener("resize", reencaixar);
    return () => window.removeEventListener("resize", reencaixar);
  }, [aberto]);

  if (!aberto) return null;

  const guardar = (nova: Geometria) => {
    setGeometria(nova);
    guardarGeometria(id, nova);
  };

  const comecar = (e: React.PointerEvent<HTMLElement>) => {
    if (cheia) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    arrasto.current = { x: e.clientX, y: e.clientY, base: geometria };
  };

  const terminar = (e: React.PointerEvent<HTMLElement>) => {
    if (!arrasto.current) return;

    e.currentTarget.releasePointerCapture(e.pointerId);
    arrasto.current = null;
    guardarGeometria(id, geometria);
  };

  const mover = (e: React.PointerEvent<HTMLElement>) => {
    const inicio = arrasto.current;
    if (!inicio) return;

    setGeometria(
      encaixarNaTela({
        ...inicio.base,
        x: inicio.base.x + (e.clientX - inicio.x),
        y: inicio.base.y + (e.clientY - inicio.y),
      }),
    );
  };

  const redimensionar = (e: React.PointerEvent<HTMLElement>) => {
    const inicio = arrasto.current;
    if (!inicio) return;

    setGeometria(
      encaixarNaTela({
        ...inicio.base,
        largura: inicio.base.largura + (e.clientX - inicio.x),
        altura: inicio.base.altura + (e.clientY - inicio.y),
      }),
    );
  };

  const posicao = cheia
    ? { left: 8, top: 8, width: window.innerWidth - 16, height: window.innerHeight - 16 }
    : {
        left: geometria.x,
        top: geometria.y,
        width: geometria.largura,
        height: encolhida ? BARRA : geometria.altura,
      };

  return (
    <section data-gc="ui.janela-flutuante.section"
      role="dialog"
      aria-label={titulo}
      style={posicao}
      className="regiao-sem-arrasto fixed z-40 flex flex-col overflow-hidden rounded-lg border border-line bg-surface-2 shadow-2xl"
    >
      <header data-gc="ui.janela-flutuante.header.comecar"
        onPointerDown={comecar}
        onPointerMove={mover}
        onPointerUp={terminar}
        onPointerCancel={terminar}
        onDoubleClick={() => setCheia((v) => !v)}
        style={{ height: BARRA, touchAction: "none" }}
        className={cn(
          "flex shrink-0 items-center gap-2 border-b border-line bg-surface-1 px-3",
          cheia ? "cursor-default" : "cursor-grab active:cursor-grabbing",
        )}
      >
        <span data-gc="ui.janela-flutuante.span" className="min-w-0 flex-1 truncate text-sm font-medium text-ink-muted">
          {titulo}
        </span>

        <BotaoDaBarra data-gc="ui.janela-flutuante.botao-da-barra"
          rotulo={encolhida ? "Voltar ao tamanho" : "Minimizar"}
          onClick={() => setEncolhida((v) => !v)}
        >
          <Minus data-gc="ui.janela-flutuante.minus" size={14} />
        </BotaoDaBarra>

        <BotaoDaBarra data-gc="ui.janela-flutuante.botao-da-barra--2"
          rotulo={cheia ? "Restaurar" : "Maximizar"}
          onClick={() => {
            setCheia((v) => !v);
            setEncolhida(false);
          }}
        >
          <Maximize2 data-gc="ui.janela-flutuante.maximize2" size={13} />
        </BotaoDaBarra>

        <BotaoDaBarra data-gc="ui.janela-flutuante.botao-da-barra.on-fechar" rotulo="Fechar" perigo onClick={onFechar}>
          <X data-gc="ui.janela-flutuante.x" size={14} />
        </BotaoDaBarra>
      </header>

      {!encolhida && <div data-gc="ui.janela-flutuante.div" className="flex min-h-0 flex-1">{children}</div>}

      {!encolhida && !cheia && (
        <span data-gc="ui.janela-flutuante.span.comecar"
          role="separator"
          aria-label="Redimensionar a janela"
          onPointerDown={comecar}
          onPointerMove={redimensionar}
          onPointerUp={terminar}
          onPointerCancel={terminar}
          style={{ touchAction: "none" }}
          className="absolute bottom-0 right-0 size-4 cursor-nwse-resize"
        />
      )}
    </section>
  );
};

const BotaoDaBarra: React.FC<{
  rotulo: string;
  perigo?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ rotulo, perigo, onClick, children }) => (
  <button data-gc="ui.janela-flutuante.button.on-click"
    type="button"
    aria-label={rotulo}
    title={rotulo}
    /// Senão o clique no botão começa a arrastar a janela junto.
    onPointerDown={(e) => e.stopPropagation()}
    onClick={onClick}
    className={cn(
      "flex size-6 shrink-0 items-center justify-center rounded text-ink-faint transition",
      perigo ? "hover:bg-danger hover:text-white" : "hover:bg-hover hover:text-ink",
    )}
  >
    {children}
  </button>
);
