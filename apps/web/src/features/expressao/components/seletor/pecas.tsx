import React from "react";
import { ChevronDown, Loader2 } from "lucide-react";

import { cn } from "~/lib/utils";

export interface AtalhoDaBarra {
  id: string;
  titulo: string;
  icone: React.ReactNode;
}

interface BarraLateralProps {
  atalhos: AtalhoDaBarra[];
  ativo: string | null;
  onIr: (id: string) => void;
}

export const BarraLateral: React.FC<BarraLateralProps> = ({ atalhos, ativo, onIr }) => {
  const trilha = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const nav = trilha.current;
    if (!nav || !ativo) return;

    const alvo = nav.querySelector<HTMLElement>(`[data-secao="${ativo}"]`);
    if (!alvo) return;

    const acima = alvo.offsetTop < nav.scrollTop;
    const abaixo = alvo.offsetTop + alvo.offsetHeight > nav.scrollTop + nav.clientHeight;
    if (!acima && !abaixo) return;

    nav.scrollTo({
      top: alvo.offsetTop - nav.clientHeight / 2 + alvo.offsetHeight / 2,
      behavior: "smooth",
    });
  }, [ativo]);

  return (
    <nav data-gc="expressao.seletor.pecas.nav"
      ref={trilha}
      className="flex w-12 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-line bg-surface-0/60 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {atalhos.map((atalho) => (
        <button data-gc="expressao.seletor.pecas.button"
          key={atalho.id}
          data-secao={atalho.id}
          onClick={() => onIr(atalho.id)}
          title={atalho.titulo}
          aria-label={atalho.titulo}
          aria-current={ativo === atalho.id}
          className={cn(
            "relative flex size-8 shrink-0 items-center justify-center rounded-lg transition",
            ativo === atalho.id
              ? "bg-surface-3 text-ink"
              : "text-ink-faint hover:bg-surface-3/60 hover:text-ink-muted",
          )}
        >
          {atalho.icone}
        </button>
      ))}
    </nav>
  );
};

export const Rodape: React.FC<{
  amostra?: React.ReactNode;
  titulo?: string;
  detalhe?: string;
  direita?: React.ReactNode;
  vazio: string;
}> = ({ amostra, titulo, detalhe, direita, vazio }) => (
  <footer data-gc="expressao.seletor.pecas.footer" className="flex h-12 shrink-0 items-center gap-2.5 border-t border-line bg-surface-0/60 px-3">
    <span data-gc="expressao.seletor.pecas.span" className="flex size-7 shrink-0 items-center justify-center text-2xl leading-none">
      {amostra}
    </span>

    {titulo ? (
      <span data-gc="expressao.seletor.pecas.span--2" className="min-w-0 flex-1 truncate text-sm">
        <span data-gc="expressao.seletor.pecas.span--3" className="font-semibold text-ink">{titulo}</span>
        {detalhe && <span data-gc="expressao.seletor.pecas.span--4" className="ml-1.5 text-ink-faint">{detalhe}</span>}
      </span>
    ) : (
      <span data-gc="expressao.seletor.pecas.span--5" className="flex-1 truncate text-sm text-ink-faint">{vazio}</span>
    )}

    {direita && <span data-gc="expressao.seletor.pecas.span--6" className="shrink-0">{direita}</span>}
  </footer>
);

export const IconeDoServidor: React.FC<{
  nome: string;
  iconUrl: string | null;
  className?: string;
}> = ({ nome, iconUrl, className = "size-6" }) =>
  iconUrl ? (
    <img data-gc="expressao.seletor.pecas.img" src={iconUrl} alt="" className={cn("rounded-full object-cover", className)} />
  ) : (
    <span data-gc="expressao.seletor.pecas.span--7"
      className={cn(
        "flex items-center justify-center rounded-full bg-surface-4 text-10 font-bold uppercase text-ink",
        className,
      )}
    >
      {nome.slice(0, 2)}
    </span>
  );

export const Secao: React.FC<{
  titulo: string;
  icone?: React.ReactNode;
  fechada?: boolean;
  onAlternar?: () => void;
  children: React.ReactNode;
}> = ({ titulo, icone, fechada = false, onAlternar, children }) => (
  <section data-gc="expressao.seletor.pecas.section" className="mb-3">
    <h4 data-gc="expressao.seletor.pecas.h4" className="sticky top-0 z-10 -mx-3 mb-1 bg-surface-1/95 backdrop-blur">
      <button data-gc="expressao.seletor.pecas.button.on-alternar"
        type="button"
        onClick={onAlternar}
        disabled={!onAlternar}
        aria-expanded={!fechada}
        className={cn(
          "flex w-full items-center gap-1.5 px-3 py-1 text-left text-xs font-semibold uppercase tracking-wide text-ink-faint transition",
          onAlternar && "hover:text-ink-muted",
        )}
      >
        {icone}
        <span data-gc="expressao.seletor.pecas.span--8" className="min-w-0 truncate">{titulo}</span>

        {onAlternar && (
          <ChevronDown data-gc="expressao.seletor.pecas.chevron-down"
            size={12}
            className={cn("ml-auto shrink-0 transition-transform", fechada && "-rotate-90")}
          />
        )}
      </button>
    </h4>

    {!fechada && children}
  </section>
);

export const Carregando: React.FC = () => (
  <div data-gc="expressao.seletor.pecas.div" className="flex justify-center py-10 text-ink-faint">
    <Loader2 data-gc="expressao.seletor.pecas.loader2" size={20} className="animate-spin" />
  </div>
);

export const Vazio: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p data-gc="expressao.seletor.pecas.p" className="px-6 py-10 text-center text-sm text-ink-faint">{children}</p>
);
