import React, { useRef, useState } from "react";
import { Check, Plus, Search } from "lucide-react";
import type { Role } from "@gravae/shared";

import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

interface SeletorDeCargosProps {
  disponiveis: Role[];
  atuais: string[];
  onAlternar: (roleId: string) => void;
  desabilitado?: boolean;
}

const BUSCA_A_PARTIR_DE = 8;

export const SeletorDeCargos: React.FC<SeletorDeCargosProps> = ({
  disponiveis,
  atuais,
  onAlternar,
  desabilitado = false,
}) => {
  const { t } = useTranslation();
  const [busca, setBusca] = useState("");
  const listaRef = useRef<HTMLDivElement>(null);

  const tem = new Set(atuais);
  const comBusca = disponiveis.length > BUSCA_A_PARTIR_DE;

  const termo = busca.trim().toLowerCase();
  const lista = [...disponiveis]
    .sort((a, b) => b.position - a.position)
    .filter((cargo) => !termo || cargo.name.toLowerCase().includes(termo));

  const navegar = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;

    const botoes = [...(listaRef.current?.querySelectorAll("button") ?? [])];
    if (!botoes.length) return;

    e.preventDefault();

    const atual = botoes.indexOf(document.activeElement as HTMLButtonElement);
    const passo = e.key === "ArrowDown" ? 1 : -1;
    const proximo = atual < 0 ? (passo > 0 ? 0 : botoes.length - 1) : atual + passo;

    botoes[(proximo + botoes.length) % botoes.length]?.focus();
  };

  return (
    <Popover data-gc="perfil.cartao.seletor-de-cargos.popover" onOpenChange={(aberto) => !aberto && setBusca("")}>
      <PopoverTrigger data-gc="perfil.cartao.seletor-de-cargos.popover-trigger" asChild>
        <button data-gc="perfil.cartao.seletor-de-cargos.button"
          type="button"
          disabled={desabilitado}
          aria-label={t("perfil.cargos.adicionar")}
          title={t("perfil.cargos.adicionar")}
          className="flex size-[22px] items-center justify-center rounded bg-surface-3 text-ink-muted transition hover:bg-surface-4 hover:text-ink disabled:opacity-50"
        >
          <Plus data-gc="perfil.cartao.seletor-de-cargos.plus" size={14} />
        </button>
      </PopoverTrigger>

      <PopoverContent data-gc="perfil.cartao.seletor-de-cargos.popover-content.navegar" align="start" className="w-60 p-1.5" onKeyDown={navegar}>
        {comBusca && (
          <div data-gc="perfil.cartao.seletor-de-cargos.div" className="mb-1 flex items-center gap-2 rounded bg-surface-1 px-2">
            <Search data-gc="perfil.cartao.seletor-de-cargos.search" size={13} className="shrink-0 text-ink-faint" />
            <input data-gc="perfil.cartao.seletor-de-cargos.input"
              autoFocus
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder={t("perfil.cargos.procurar")}
              aria-label={t("perfil.cargos.procurar")}
              className="w-full bg-transparent py-1.5 text-sm text-ink outline-none placeholder:text-ink-faint"
            />
          </div>
        )}

        <div data-gc="perfil.cartao.seletor-de-cargos.div--2" ref={listaRef} className="max-h-56 overflow-y-auto">
          {lista.map((cargo) => (
            <button data-gc="perfil.cartao.seletor-de-cargos.button--2"
              key={cargo.id}
              type="button"
              disabled={desabilitado}
              onClick={() => onAlternar(cargo.id)}
              className={cn(
                "flex w-full cursor-pointer items-center justify-between gap-3 rounded px-2.5 py-2 text-left text-sm text-ink-muted outline-none transition",
                "hover:bg-brand hover:text-white focus-visible:bg-brand focus-visible:text-white",
                "disabled:cursor-default disabled:opacity-50",
              )}
            >
              <span data-gc="perfil.cartao.seletor-de-cargos.span" className="flex min-w-0 items-center gap-2">
                {cargo.iconEmoji ? (
                  <span data-gc="perfil.cartao.seletor-de-cargos.span--2" className="leading-none">{cargo.iconEmoji}</span>
                ) : cargo.iconUrl ? (
                  <img data-gc="perfil.cartao.seletor-de-cargos.img" src={cargo.iconUrl} alt="" className="size-3.5 rounded-sm object-cover" />
                ) : (
                  <span data-gc="perfil.cartao.seletor-de-cargos.span--3"
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: cargo.color ?? "var(--color-ink-faint)" }}
                  />
                )}
                <span data-gc="perfil.cartao.seletor-de-cargos.span--4" className="min-w-0 truncate">{cargo.name}</span>
              </span>

              {tem.has(cargo.id) && <Check data-gc="perfil.cartao.seletor-de-cargos.check" size={14} className="shrink-0" />}
            </button>
          ))}

          {!lista.length && (
            <p data-gc="perfil.cartao.seletor-de-cargos.p" className="px-2.5 py-2 text-sm text-ink-faint">
              {termo ? "Nenhum cargo com esse nome" : "Nenhum cargo pra dar"}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
