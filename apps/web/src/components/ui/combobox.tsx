import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

import { Popover, PopoverAnchor, PopoverContent } from "~/components/ui/popover";
import { cn } from "~/lib/utils";

export interface OpcaoDoCombobox<T extends string | number> {
  valor: T;
  rotulo: string;
}

interface ComboboxProps<T extends string | number> {
  id?: string;
  valor: T;
  onEscolher: (valor: T) => void;
  opcoes: OpcaoDoCombobox<T>[];
  placeholder?: string;
  vazio?: string;
  disabled?: boolean;
  className?: string;
}

export function Combobox<T extends string | number>({
  id,
  valor,
  onEscolher,
  opcoes,
  placeholder,
  vazio = "Nada encontrado.",
  disabled,
  className,
}: ComboboxProps<T>) {
  const [aberto, setAberto] = React.useState(false);
  const [filtro, setFiltro] = React.useState<string | null>(null);
  const [ativo, setAtivo] = React.useState(0);
  const campo = React.useRef<HTMLInputElement>(null);
  const ancora = React.useRef<HTMLDivElement>(null);

  const escolhida = opcoes.find((o) => o.valor === valor);
  const digitando = filtro !== null;

  const filtradas = React.useMemo(() => {
    const termo = (filtro ?? "").trim().toLowerCase();
    if (!termo) return opcoes;

    return opcoes.filter((o) => o.rotulo.toLowerCase().includes(termo));
  }, [opcoes, filtro]);

  const abrirEm = (indice: number) => {
    setAberto(true);
    setAtivo(indice);
  };

  const fechar = () => {
    setAberto(false);
    setFiltro(null);
  };

  const confirmar = (escolha: T) => {
    onEscolher(escolha);
    fechar();
  };

  const aoTeclar = (evento: React.KeyboardEvent<HTMLInputElement>) => {
    if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
      evento.preventDefault();

      if (!aberto) {
        abrirEm(Math.max(0, opcoes.findIndex((o) => o.valor === valor)));
        return;
      }

      if (!filtradas.length) return;
      const passo = evento.key === "ArrowDown" ? 1 : -1;
      setAtivo((atual) => (atual + passo + filtradas.length) % filtradas.length);
      return;
    }

    if (evento.key === "Enter" && aberto) {
      evento.preventDefault();
      const alvo = filtradas[ativo];
      if (alvo) confirmar(alvo.valor);
      return;
    }

    if (evento.key === "Escape" && aberto) {
      evento.preventDefault();
      fechar();
    }
  };

  return (
    <Popover open={aberto} onOpenChange={(proximo) => (proximo ? setAberto(true) : fechar())}>
      <PopoverAnchor asChild>
        <div
          ref={ancora}
          className={cn(
            "flex h-10 w-full items-center gap-2 rounded-lg border border-line bg-campo px-3 transition",
            "focus-within:border-ink-faint/40",
            disabled && "pointer-events-none opacity-50",
            className,
          )}
        >
          <input
            id={id}
            ref={campo}
            role="combobox"
            aria-expanded={aberto}
            aria-autocomplete="list"
            autoComplete="off"
            disabled={disabled}
            placeholder={placeholder}
            value={digitando ? filtro : (escolhida?.rotulo ?? "")}
            onChange={(e) => {
              setFiltro(e.target.value);
              setAberto(true);
              setAtivo(0);
            }}
            onMouseDown={() => {
              if (!aberto) abrirEm(Math.max(0, opcoes.findIndex((o) => o.valor === valor)));
            }}
            onBlur={fechar}
            onKeyDown={aoTeclar}
            className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
          />

          <button
            type="button"
            tabIndex={-1}
            aria-hidden
            onMouseDown={(evento) => {
              evento.preventDefault();
              if (aberto) return fechar();

              campo.current?.focus();
              abrirEm(Math.max(0, opcoes.findIndex((o) => o.valor === valor)));
            }}
            className="shrink-0 text-ink-faint transition hover:text-ink"
          >
            <ChevronDown
              size={16}
              className={cn("transition-transform duration-200 ease-in-out", aberto && "rotate-180")}
            />
          </button>
        </div>
      </PopoverAnchor>

      <PopoverContent
        align="start"
        sideOffset={6}
        onOpenAutoFocus={(evento) => evento.preventDefault()}
        onCloseAutoFocus={(evento) => evento.preventDefault()}
        onFocusOutside={(evento) => evento.preventDefault()}
        onPointerDownOutside={(evento) => {
          const alvo = evento.target;
          if (alvo instanceof Node && ancora.current?.contains(alvo)) evento.preventDefault();
        }}
        className="w-[var(--radix-popover-trigger-width)] max-h-60 overflow-y-auto p-1 shadow-[0_0.5rem_1rem_rgb(0_0_0/0.24)]"
      >
        {!filtradas.length && (
          <p className="px-2 py-3 text-center text-sm text-ink-muted">{vazio}</p>
        )}

        {filtradas.map((opcao, indice) => {
          const selecionada = opcao.valor === valor;

          return (
            <button
              key={String(opcao.valor)}
              type="button"
              role="option"
              aria-selected={selecionada}
              onMouseDown={(evento) => {
                evento.preventDefault();
                confirmar(opcao.valor);
              }}
              onMouseMove={() => setAtivo(indice)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                indice === ativo ? "bg-brand text-white" : "text-ink-muted",
              )}
            >
              <span className="min-w-0 flex-1 truncate">{opcao.rotulo}</span>
              {selecionada && <Check size={14} className="shrink-0" />}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
