import React, { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

import type { EscopoDeBusca } from "~/@core/application/requests/message/buscar-mensagens";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Tooltip } from "~/components/ui/tooltip";
import { FILTROS_DE_BUSCA } from "~/features/conversa/lib/busca";
import { flxAttr, flxCls } from "~/lib/compat-de-tema";
import { cn } from "~/lib/utils";

interface CampoDeBuscaProps {
  termo: string;
  onBuscar: (termo: string) => void;
  escopo?: EscopoDeBusca;
  escopos?: EscopoDeBusca[];
  onEscopo?: (escopo: EscopoDeBusca) => void;
}

/*
  O campo de busca, com as chaves e o escopo.

  Com o campo focado, a lista de chaves aparece embaixo: clicar numa põe
  `chave:` no texto, e o resto a pessoa completa. O escopo mora num botão ao
  lado, e diz onde procurar — este servidor, todos, só as conversas.
*/
export const CampoDeBusca: React.FC<CampoDeBuscaProps> = ({
  termo,
  onBuscar,
  escopo = "servidor",
  escopos,
  onEscopo,
}) => {
  const { t } = useTranslation();
  const [rascunho, setRascunho] = useState(termo);
  const [focado, setFocado] = useState(false);
  const campo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!termo) setRascunho("");
  }, [termo]);

  const acrescentar = (chave: string) => {
    const base = rascunho.trim();
    setRascunho(base ? `${base} ${chave}:` : `${chave}:`);
    campo.current?.focus();
  };

  return (
    <div data-gc="conversa.campo-de-busca.div"
      {...flxAttr("campoDaBusca")}
      className={cn(
        "relative hidden items-center gap-1 @2xl:flex",
        flxCls("molduraDaBusca"),
        flxCls("ancoraDaBusca"),
        flxCls("campoDaBusca"),
      )}
    >
      {escopos && onEscopo && (
        <DropdownMenu data-gc="conversa.campo-de-busca.dropdown-menu">
          <Tooltip data-gc="conversa.campo-de-busca.tooltip" label={`${t("conversa.busca.escopo.titulo")}: ${t(`conversa.busca.escopo.${escopo}`)}`}>
            <DropdownMenuTrigger data-gc="conversa.campo-de-busca.dropdown-menu-trigger" asChild>
              <button data-gc="conversa.campo-de-busca.button"
                type="button"
                aria-label={t("conversa.busca.escopo.titulo")}
                className="flex size-7 shrink-0 items-center justify-center rounded text-ink-muted transition hover:bg-surface-3 hover:text-ink"
              >
                <MagnifyingGlass data-gc="conversa.campo-de-busca.magnifying-glass" size={16} />
              </button>
            </DropdownMenuTrigger>
          </Tooltip>

          <DropdownMenuContent data-gc="conversa.campo-de-busca.dropdown-menu-content" align="end">
            <DropdownMenuRadioGroup data-gc="conversa.campo-de-busca.dropdown-menu-radio-group" value={escopo} onValueChange={(valor) => onEscopo(valor as EscopoDeBusca)}>
              {escopos.map((opcao) => (
                <DropdownMenuRadioItem data-gc="conversa.campo-de-busca.dropdown-menu-radio-item" key={opcao} value={opcao}>
                  {t(`conversa.busca.escopo.${opcao}`)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <div data-gc="conversa.campo-de-busca.div--2" className="relative flex items-center">
        {!escopos && (
          <MagnifyingGlass data-gc="conversa.campo-de-busca.magnifying-glass--2" size={14} className="pointer-events-none absolute left-2 text-ink-faint" />
        )}

        <input data-gc="conversa.campo-de-busca.input"
          ref={campo}
          value={rascunho}
          onChange={(e) => setRascunho(e.target.value)}
          onFocus={() => setFocado(true)}
          onBlur={() => setTimeout(() => setFocado(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onBuscar(rascunho.trim());
              setFocado(false);
            }
            if (e.key === "Escape") {
              setRascunho("");
              onBuscar("");
              e.currentTarget.blur();
            }
          }}
          placeholder={t("conversa.busca.pesquisar")}
          aria-label={t("conversa.busca.pesquisar")}
          className={cn(
            "h-7 w-36 rounded bg-surface-1 pr-6 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:w-64 focus:ring-1 focus:ring-brand",
            escopos ? "pl-2.5" : "pl-7",
            flxCls("campoDoTextoDaBusca"),
          )}
        />

        {rascunho && (
          <button data-gc="conversa.campo-de-busca.button--2"
            onClick={() => {
              setRascunho("");
              onBuscar("");
            }}
            aria-label={t("conversa.busca.limpar")}
            className={cn("absolute right-1.5 text-ink-faint transition hover:text-ink", flxCls("limparBusca"))}
          >
            <X data-gc="conversa.campo-de-busca.x" size={13} />
          </button>
        )}
      </div>

      {focado && (
        <div data-gc="conversa.campo-de-busca.div--3" className="absolute right-0 top-full z-40 mt-1.5 w-80 rounded-lg border border-line bg-surface-4 p-1.5 shadow-2xl">
          <p data-gc="conversa.campo-de-busca.p" className="px-2 pb-1 pt-1.5 text-11 font-semibold uppercase text-ink-faint">{t("conversa.busca.filtros")}</p>
          {FILTROS_DE_BUSCA.map((filtro) => (
            <button data-gc="conversa.campo-de-busca.button--3"
              key={filtro.chave}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => acrescentar(filtro.chave)}
              className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm transition hover:bg-hover"
            >
              <span data-gc="conversa.campo-de-busca.span" className="rounded bg-surface-2 px-1.5 py-px font-mono text-xs text-ink">{filtro.chave}:</span>
              <span data-gc="conversa.campo-de-busca.span--2" className="min-w-0 flex-1 truncate text-ink-muted">{filtro.dica}</span>
              <Plus data-gc="conversa.campo-de-busca.plus" size={14} className="shrink-0 text-ink-faint" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
