import React, { useRef, useState } from "react";
import { Check, Plus, Search } from "lucide-react";
import type { Role } from "@gravae/shared";

import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

interface RolesPropsPicker {
  available: Role[];
  current: string[];
  onToggle: (roleId: string) => void;
  disabled?: boolean;
}

const SEARCH_FROM = 8;

export const RolesPicker: React.FC<RolesPropsPicker> = ({
  available,
  current,
  onToggle,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const has = new Set(current);
  const withSearch = available.length > SEARCH_FROM;

  const term = search.trim().toLowerCase();
  const list = [...available]
    .sort((a, b) => b.position - a.position)
    .filter((role) => !term || role.name.toLowerCase().includes(term));

  const navigate = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;

    const buttons = [...(listRef.current?.querySelectorAll("button") ?? [])];
    if (!buttons.length) return;

    e.preventDefault();

    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const step = e.key === "ArrowDown" ? 1 : -1;
    const next = current < 0 ? (step > 0 ? 0 : buttons.length - 1) : current + step;

    buttons[(next + buttons.length) % buttons.length]?.focus();
  };

  return (
    <Popover data-gc="perfil.cartao.seletor-de-cargos.popover" onOpenChange={(isOpen) => !isOpen && setSearch("")}>
      <PopoverTrigger data-gc="perfil.cartao.seletor-de-cargos.popover-trigger" asChild>
        <button data-gc="perfil.cartao.seletor-de-cargos.button"
          type="button"
          disabled={disabled}
          aria-label={t("perfil.cargos.adicionar")}
          title={t("perfil.cargos.adicionar")}
          className="flex size-[22px] items-center justify-center rounded bg-surface-3 text-ink-muted transition hover:bg-surface-4 hover:text-ink disabled:opacity-50"
        >
          <Plus data-gc="perfil.cartao.seletor-de-cargos.plus" size={14} />
        </button>
      </PopoverTrigger>

      <PopoverContent data-gc="perfil.cartao.seletor-de-cargos.popover-content.navigate" align="start" className="w-60 p-1.5" onKeyDown={navigate}>
        {withSearch && (
          <div data-gc="perfil.cartao.seletor-de-cargos.div" className="mb-1 flex items-center gap-2 rounded bg-surface-1 px-2">
            <Search data-gc="perfil.cartao.seletor-de-cargos.search" size={13} className="shrink-0 text-ink-faint" />
            <input data-gc="perfil.cartao.seletor-de-cargos.input"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("perfil.cargos.procurar")}
              aria-label={t("perfil.cargos.procurar")}
              className="w-full bg-transparent py-1.5 text-sm text-ink outline-none placeholder:text-ink-faint"
            />
          </div>
        )}

        <div data-gc="perfil.cartao.seletor-de-cargos.div--2" ref={listRef} className="max-h-56 overflow-y-auto">
          {list.map((role) => (
            <button data-gc="perfil.cartao.seletor-de-cargos.button--2"
              key={role.id}
              type="button"
              disabled={disabled}
              onClick={() => onToggle(role.id)}
              className={cn(
                "flex w-full cursor-pointer items-center justify-between gap-3 rounded px-2.5 py-2 text-left text-sm text-ink-muted outline-none transition",
                "hover:bg-brand hover:text-sobre-marca focus-visible:bg-brand focus-visible:text-sobre-marca",
                "disabled:cursor-default disabled:opacity-50",
              )}
            >
              <span data-gc="perfil.cartao.seletor-de-cargos.span" className="flex min-w-0 items-center gap-2">
                {role.iconEmoji ? (
                  <span data-gc="perfil.cartao.seletor-de-cargos.span--2" className="leading-none">{role.iconEmoji}</span>
                ) : role.iconUrl ? (
                  <img data-gc="perfil.cartao.seletor-de-cargos.img" src={role.iconUrl} alt="" className="size-3.5 rounded-sm object-cover" />
                ) : (
                  <span data-gc="perfil.cartao.seletor-de-cargos.span--3"
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: role.color ?? "var(--color-ink-faint)" }}
                  />
                )}
                <span data-gc="perfil.cartao.seletor-de-cargos.span--4" className="min-w-0 truncate">{role.name}</span>
              </span>

              {has.has(role.id) && <Check data-gc="perfil.cartao.seletor-de-cargos.check" size={14} className="shrink-0" />}
            </button>
          ))}

          {!list.length && (
            <p data-gc="perfil.cartao.seletor-de-cargos.p" className="px-2.5 py-2 text-sm text-ink-faint">
              {term ? "Nenhum cargo com esse nome" : "Nenhum cargo pra dar"}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
