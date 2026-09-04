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

/**
 * Autocomplete: um campo em que se DIGITA, com a lista de sugestões embaixo.
 *
 * O gatilho é o próprio `<input>` — não um botão que abre uma busca separada.
 * É a diferença entre este e um `<select>` enfeitado: quem já sabe o que quer
 * escreve as primeiras letras e confirma sem tirar a mão do teclado, e quem não
 * sabe abre e lê a lista inteira.
 *
 * O que está escrito no campo é o RÓTULO da escolha enquanto ninguém digita.
 * Assim que alguém digita, o texto passa a ser o filtro; sair sem escolher
 * devolve o rótulo. Sem essa volta, o campo ficaria com um pedaço de palavra
 * dentro dele dizendo uma coisa e o valor guardado dizendo outra.
 */
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
  /// `null` = ninguém digitou desde a última escolha; o campo mostra o rótulo.
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
    /// Volta a mostrar o rótulo: o filtro era do balão, e o balão fechou.
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
      {/*
        `PopoverAnchor`, e não `PopoverTrigger`: o gatilho do Radix leva o foco
        pra dentro do balão quando abre, e aqui o foco tem de ficar no campo —
        é nele que se continua digitando com a lista aberta.
      */}
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
              /// Filtrar encurta a lista: o cursor volta pro topo, senão aponta
              /// pra um índice que não existe mais e o Enter não escolhe nada.
              setAtivo(0);
            }}
            /*
              Abrir é no CLIQUE, não no foco. Os dois bugs vinham daí:

              - Clicar de novo no campo já focado não abria mais. Depois de
                escolher, o foco continua aqui (as opções seguram o `mousedown`
                pra escolha não se perder), e um segundo clique não dispara
                `focus` nenhum — não havia o que reabrir a lista.
              - Clicar no RÓTULO abria a lista. `<label htmlFor>` manda o foco
                pro campo, e o campo abria. Rótulo é pra apontar o campo, não
                pra operá-lo.

              `mousedown` dispara em todo clique, focado ou não, e o rótulo não
              passa por ele.
            */
            onMouseDown={() => {
              if (!aberto) abrirEm(Math.max(0, opcoes.findIndex((o) => o.valor === valor)));
            }}
            /// Escolher com o mouse não passa por aqui: as opções seguram o
            /// `mousedown`, então o campo nunca chega a perder o foco. Sair de
            /// verdade — Tab, ou um clique em qualquer outro lugar — fecha.
            onBlur={fechar}
            onKeyDown={aoTeclar}
            className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
          />

          <button
            type="button"
            tabIndex={-1}
            aria-hidden
            /// `onMouseDown` com o padrão barrado: sem isso o botão rouba o foco
            /// do campo, o `blur` fecha a lista e o clique a reabre em seguida —
            /// a seta piscava em vez de alternar.
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
        /*
          O foco NÃO entra no balão, nem na abertura nem no fechamento: ele mora
          no campo o tempo todo. Sem estes dois, abrir tiraria o cursor de onde
          a pessoa está escrevendo.
        */
        onOpenAutoFocus={(evento) => evento.preventDefault()}
        onCloseAutoFocus={(evento) => evento.preventDefault()}
        /*
          Sem isto a lista NÃO ABRE — abre e se fecha no mesmo quadro.

          O `DismissableLayer` do Radix fecha o balão quando o foco está fora da
          camada dele. Aqui o foco mora no campo, que é o âncora e fica de fora
          por construção: era ele mesmo, o foco que precisa continuar no campo,
          que disparava o fechamento no instante da abertura.

          Quem fecha por perda de foco passa a ser o `onBlur` do campo, que é
          onde essa decisão de fato pertence.
        */
        onFocusOutside={(evento) => evento.preventDefault()}
        /*
          Clicar DENTRO do campo não fecha a lista.

          Pro Radix, tudo que não está na camada do balão é "fora" — e o campo,
          que é o âncora, está fora. Sem esta guarda, cada clique no texto que se
          está digitando fechava a lista debaixo do dedo: um clique abria, o
          segundo fechava, e parecia que ela tinha travado.

          Fora do âncora o comportamento é o normal: clicou em qualquer outro
          lugar, fecha.
        */
        onPointerDownOutside={(evento) => {
          const alvo = evento.target;
          if (alvo instanceof Node && ancora.current?.contains(alvo)) evento.preventDefault();
        }}
        /*
          A lista NÃO tem animação de entrada, e isso é de propósito: o `.popup`
          do `FormCombobox.module.css` da referência é estático. A única coisa
          que se move lá é a seta, girando 180° em 0.2s — que é o que o gatilho
          faz aqui. Eu tinha posto uma descida de 8px; era invenção minha.

          A sombra é a de lá: `0 0.5rem 1rem rgb(0 0 0 / 0.24)`, mais rasa que a
          `shadow-2xl` que o balão traz por padrão.
        */
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
              /// `onMouseDown` e não `onClick`: o clique tira o foco do campo
              /// antes de chegar aqui, e o `blur` fecharia o balão debaixo do
              /// dedo — a escolha se perderia no caminho.
              onMouseDown={(evento) => {
                evento.preventDefault();
                confirmar(opcao.valor);
              }}
              /*
                O realce segue o TECLADO, e por isso `onMouseMove` e não
                `onMouseEnter`: a lista pode nascer debaixo do cursor parado, e
                aí a linha sob ele roubaria o realce de quem chegou pelas setas
                sem ninguém ter mexido no mouse.
              */
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
