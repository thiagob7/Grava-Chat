import React from "react";
import { ChevronDown, Loader2 } from "lucide-react";

import { cn } from "~/lib/utils";

/**
 * A coluna de atalhos da esquerda. Cada item leva a uma seção da lista; o
 * ativo é quem está no topo do que se vê, não o último clicado — senão rolar
 * com a roda do mouse deixa a coluna mentindo.
 */
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

export const BarraLateral: React.FC<BarraLateralProps> = ({ atalhos, ativo, onIr }) => (
  <nav className="flex w-12 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-line bg-surface-0/60 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    {atalhos.map((atalho) => (
      <button
        key={atalho.id}
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

/**
 * O rodapé que mostra o que está sob o cursor. Fica sempre com a mesma
 * altura, com ou sem nada apontado, para a grade não pular quando o mouse
 * entra e sai.
 */
export const Rodape: React.FC<{
  amostra?: React.ReactNode;
  titulo?: string;
  detalhe?: string;
  direita?: React.ReactNode;
  vazio: string;
}> = ({ amostra, titulo, detalhe, direita, vazio }) => (
  <footer className="flex h-12 shrink-0 items-center gap-2.5 border-t border-line bg-surface-0/60 px-3">
    <span className="flex size-7 shrink-0 items-center justify-center text-2xl leading-none">
      {amostra}
    </span>

    {titulo ? (
      <span className="min-w-0 flex-1 truncate text-sm">
        <span className="font-semibold text-ink">{titulo}</span>
        {detalhe && <span className="ml-1.5 text-ink-faint">{detalhe}</span>}
      </span>
    ) : (
      <span className="flex-1 truncate text-sm text-ink-faint">{vazio}</span>
    )}

    {direita && <span className="shrink-0">{direita}</span>}
  </footer>
);

/** O ícone do servidor, ou as duas primeiras letras quando não há imagem. */
export const IconeDoServidor: React.FC<{
  nome: string;
  iconUrl: string | null;
  className?: string;
}> = ({ nome, iconUrl, className = "size-6" }) =>
  iconUrl ? (
    <img src={iconUrl} alt="" className={cn("rounded-full object-cover", className)} />
  ) : (
    <span
      className={cn(
        "flex items-center justify-center rounded-full bg-surface-4 text-[10px] font-bold uppercase text-ink",
        className,
      )}
    >
      {nome.slice(0, 2)}
    </span>
  );

/**
 * Um bloco da lista, com o cabeçalho grudado no topo enquanto ele passa.
 *
 * O cabeçalho inteiro é o botão de abrir e fechar — mirar só na setinha de
 * 12px seria um alvo pequeno demais para algo que se usa o tempo todo.
 */
export const Secao: React.FC<{
  titulo: string;
  icone?: React.ReactNode;
  fechada?: boolean;
  onAlternar?: () => void;
  children: React.ReactNode;
}> = ({ titulo, icone, fechada = false, onAlternar, children }) => (
  <section className="mb-3">
    <h4 className="sticky top-0 z-10 -mx-3 mb-1 bg-surface-1/95 backdrop-blur">
      <button
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
        <span className="min-w-0 truncate">{titulo}</span>

        {onAlternar && (
          <ChevronDown
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
  <div className="flex justify-center py-10 text-ink-faint">
    <Loader2 size={20} className="animate-spin" />
  </div>
);

export const Vazio: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="px-6 py-10 text-center text-sm text-ink-faint">{children}</p>
);
