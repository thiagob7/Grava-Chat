import React, { useMemo, useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  ROLES_NAMES,
  asRule,
  type CursorImported,
  type CursorRole,
} from "~/features/configuracoes/lib/cursor-importado";
import {
  CURSORS_LIBRARY,
  LIBRARY_FAMILIES,
} from "~/features/configuracoes/lib/biblioteca-de-cursores";
import { cn } from "~/lib/utils";

interface Props {
  role: CursorRole | null;
  onClose: () => void;
  onPick: (cursor: CursorImported) => void;
}

export const PickLibrary: React.FC<Props> = ({ role, onClose, onPick }) => {
  const [search, setSearch] = useState("");
  const [family, setFamily] = useState<string | null>(null);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();

    return CURSORS_LIBRARY.filter((item) => {
      if (family && item.family !== family) return false;
      if (!term) return true;

      return item.label.toLowerCase().includes(term) || item.id.includes(term);
    });
  }, [search, family]);

  return (
    <Dialog data-gc="configuracoes.escolher-da-biblioteca.dialog" open={role !== null} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent data-gc="configuracoes.escolher-da-biblioteca.dialog-content" className="max-w-3xl">
        <DialogHeader data-gc="configuracoes.escolher-da-biblioteca.dialog-header">
          <DialogTitle data-gc="configuracoes.escolher-da-biblioteca.dialog-title">
            Biblioteca de cursores
            {role && (
              <span data-gc="configuracoes.escolher-da-biblioteca.span" className="ml-2 text-sm font-normal text-ink-muted">
                para {ROLES_NAMES[role].title.toLowerCase()}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div data-gc="configuracoes.escolher-da-biblioteca.div" className="border-b border-line px-5 pb-4">
          <div data-gc="configuracoes.escolher-da-biblioteca.div--2" className="relative">
            <MagnifyingGlass data-gc="configuracoes.escolher-da-biblioteca.magnifying-glass"
              size={15}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <Input data-gc="configuracoes.escolher-da-biblioteca.input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Procurar por nome"
              className="pl-8"
            />
          </div>

          <div data-gc="configuracoes.escolher-da-biblioteca.div--3" className="mt-3 flex flex-wrap gap-1.5">
            <Filter data-gc="configuracoes.escolher-da-biblioteca.filter" active={!family} onClick={() => setFamily(null)}>
              Tudo
            </Filter>

            {LIBRARY_FAMILIES.map((name) => (
              <Filter data-gc="configuracoes.escolher-da-biblioteca.filter--2" key={name} active={family === name} onClick={() => setFamily(name)}>
                {name}
              </Filter>
            ))}
          </div>
        </div>

        <div data-gc="configuracoes.escolher-da-biblioteca.div--4" className="max-h-[50vh] overflow-y-auto px-5 py-4">
          {visible.length === 0 ? (
            <p data-gc="configuracoes.escolher-da-biblioteca.p" className="py-10 text-center text-sm text-ink-muted">
              Nenhum cursor com esse nome.
            </p>
          ) : (
            <div data-gc="configuracoes.escolher-da-biblioteca.div--5" className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
              {visible.map((item) => (
                <button data-gc="configuracoes.escolher-da-biblioteca.button"
                  key={item.id}
                  title={item.label}
                  onClick={() => {
                    onPick(item.cursor);
                    onClose();
                  }}
                  style={{
                    cursor: role ? (asRule(item.cursor, role) ?? undefined) : undefined,
                  }}
                  className="grid aspect-square place-items-center rounded-lg border border-line bg-surface-2 transition hover:border-brand hover:bg-surface-3"
                >
                  <img data-gc="configuracoes.escolher-da-biblioteca.img" src={item.cursor.image} alt={item.label} className="size-8 object-contain" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        <p data-gc="configuracoes.escolher-da-biblioteca.p--2" className="border-t border-line px-5 py-3 text-xs text-ink-faint">
          {visible.length} de {CURSORS_LIBRARY.length} desenhos. O ponto de
          clique de cada um já vem medido.
        </p>
      </DialogContent>
    </Dialog>
  );
};

const Filter: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({
  active,
  onClick,
  children,
}) => (
  <button data-gc="configuracoes.escolher-da-biblioteca.button.on-click"
    onClick={onClick}
    className={cn(
      "rounded-full px-2.5 py-1 text-11 font-medium transition",
      active ? "bg-brand text-sobre-marca" : "bg-surface-3 text-ink-muted hover:bg-surface-4 hover:text-ink",
    )}
  >
    {children}
  </button>
);
