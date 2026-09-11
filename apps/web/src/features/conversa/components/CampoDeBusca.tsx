import React, { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

import type { SearchScope } from "~/@core/application/requests/message/buscar-mensagens";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Tooltip } from "~/components/ui/tooltip";
import { SEARCH_FILTERS } from "~/features/conversa/lib/busca";
import { flxAttr, flxCls } from "~/lib/compat-de-tema";
import { cn } from "~/lib/utils";

interface SearchPropsField {
  term: string;
  onSearch: (term: string) => void;
  scope?: SearchScope;
  scopes?: SearchScope[];
  onScope?: (scope: SearchScope) => void;
}

export const SearchField: React.FC<SearchPropsField> = ({
  term,
  onSearch,
  scope = "servidor",
  scopes,
  onScope,
}) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(term);
  const [focused, setFocused] = useState(false);
  const field = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!term) setDraft("");
  }, [term]);

  const append = (key: string) => {
    const base = draft.trim();
    setDraft(base ? `${base} ${key}:` : `${key}:`);
    field.current?.focus();
  };

  return (
    <div data-gc="conversa.campo-de-busca.div"
      {...flxAttr("searchField")}
      className={cn(
        "relative hidden items-center @2xl:flex",
        flxCls("searchFrame"),
        flxCls("searchAnchor"),
        flxCls("searchField"),
      )}
    >
      <div data-gc="conversa.campo-de-busca.div--2" className="relative flex items-center">
        {scopes && onScope ? (
          <DropdownMenu data-gc="conversa.campo-de-busca.dropdown-menu">
            <Tooltip data-gc="conversa.campo-de-busca.tooltip" label={`${t("conversa.busca.escopo.titulo")}: ${t(`conversa.busca.escopo.${scope}`)}`}>
              <DropdownMenuTrigger data-gc="conversa.campo-de-busca.dropdown-menu-trigger" asChild>
                <button data-gc="conversa.campo-de-busca.button"
                  type="button"
                  aria-label={t("conversa.busca.escopo.titulo")}
                  className="absolute left-1 flex size-7 shrink-0 items-center justify-center rounded text-ink-faint transition hover:bg-surface-3 hover:text-ink"
                >
                  <MagnifyingGlass data-gc="conversa.campo-de-busca.magnifying-glass" size={16} />
                </button>
              </DropdownMenuTrigger>
            </Tooltip>

            <DropdownMenuContent data-gc="conversa.campo-de-busca.dropdown-menu-content" align="end">
              <DropdownMenuRadioGroup data-gc="conversa.campo-de-busca.dropdown-menu-radio-group" value={scope} onValueChange={(value) => onScope(value as SearchScope)}>
                {scopes.map((option) => (
                  <DropdownMenuRadioItem data-gc="conversa.campo-de-busca.dropdown-menu-radio-item" key={option} value={option}>
                    {t(`conversa.busca.escopo.${option}`)}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <MagnifyingGlass data-gc="conversa.campo-de-busca.magnifying-glass--2" size={16} className="pointer-events-none absolute left-2.5 text-ink-faint" />
        )}

        <input data-gc="conversa.campo-de-busca.input"
          ref={field}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSearch(draft.trim());
              setFocused(false);
            }
            if (e.key === "Escape") {
              setDraft("");
              onSearch("");
              e.currentTarget.blur();
            }
          }}
          placeholder={t("conversa.busca.pesquisar")}
          aria-label={t("conversa.busca.pesquisar")}
          className={cn(
            "h-9 w-56 rounded-lg border border-line bg-campo pl-9 pr-7 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:w-72 focus:border-campo-foco",
            flxCls("textSearchField"),
          )}
        />

        {draft && (
          <button data-gc="conversa.campo-de-busca.button--2"
            onClick={() => {
              setDraft("");
              onSearch("");
            }}
            aria-label={t("conversa.busca.limpar")}
            className={cn("absolute right-2 text-ink-faint transition hover:text-ink", flxCls("clearSearch"))}
          >
            <X data-gc="conversa.campo-de-busca.x" size={13} />
          </button>
        )}
      </div>

      {focused && (
        <div data-gc="conversa.campo-de-busca.div--3" className="absolute right-0 top-full z-40 mt-1.5 w-80 rounded-lg border border-line bg-surface-4 p-1.5 shadow-2xl">
          <p data-gc="conversa.campo-de-busca.p" className="px-2 pb-1 pt-1.5 text-11 font-semibold uppercase text-ink-faint">{t("conversa.busca.filtros")}</p>
          {SEARCH_FILTERS.map((filter) => (
            <button data-gc="conversa.campo-de-busca.button--3"
              key={filter.key}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => append(filter.key)}
              className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm transition hover:bg-hover"
            >
              <span data-gc="conversa.campo-de-busca.span" className="rounded bg-surface-2 px-1.5 py-px font-mono text-xs text-ink">{filter.key}:</span>
              <span data-gc="conversa.campo-de-busca.span--2" className="min-w-0 flex-1 truncate text-ink-muted">{filter.hint}</span>
              <Plus data-gc="conversa.campo-de-busca.plus" size={14} className="shrink-0 text-ink-faint" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
