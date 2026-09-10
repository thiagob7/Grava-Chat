import React, { useMemo, useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  NOMES_DOS_PAPEIS,
  comoRegra,
  type CursorImportado,
  type PapelDeCursor,
} from "~/features/configuracoes/lib/cursor-importado";
import {
  BIBLIOTECA_DE_CURSORES,
  FAMILIAS_DA_BIBLIOTECA,
} from "~/features/configuracoes/lib/biblioteca-de-cursores";
import { cn } from "~/lib/utils";

interface Props {
  papel: PapelDeCursor | null;
  onFechar: () => void;
  onEscolher: (cursor: CursorImportado) => void;
}

export const EscolherDaBiblioteca: React.FC<Props> = ({ papel, onFechar, onEscolher }) => {
  const [busca, setBusca] = useState("");
  const [familia, setFamilia] = useState<string | null>(null);

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return BIBLIOTECA_DE_CURSORES.filter((item) => {
      if (familia && item.familia !== familia) return false;
      if (!termo) return true;

      return item.rotulo.toLowerCase().includes(termo) || item.id.includes(termo);
    });
  }, [busca, familia]);

  return (
    <Dialog data-gc="configuracoes.escolher-da-biblioteca.dialog" open={papel !== null} onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent data-gc="configuracoes.escolher-da-biblioteca.dialog-content" className="max-w-3xl">
        <DialogHeader data-gc="configuracoes.escolher-da-biblioteca.dialog-header">
          <DialogTitle data-gc="configuracoes.escolher-da-biblioteca.dialog-title">
            Biblioteca de cursores
            {papel && (
              <span data-gc="configuracoes.escolher-da-biblioteca.span" className="ml-2 text-sm font-normal text-ink-muted">
                para {NOMES_DOS_PAPEIS[papel].titulo.toLowerCase()}
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
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Procurar por nome"
              className="pl-8"
            />
          </div>

          <div data-gc="configuracoes.escolher-da-biblioteca.div--3" className="mt-3 flex flex-wrap gap-1.5">
            <Filtro data-gc="configuracoes.escolher-da-biblioteca.filtro" ativo={!familia} onClick={() => setFamilia(null)}>
              Tudo
            </Filtro>

            {FAMILIAS_DA_BIBLIOTECA.map((nome) => (
              <Filtro data-gc="configuracoes.escolher-da-biblioteca.filtro--2" key={nome} ativo={familia === nome} onClick={() => setFamilia(nome)}>
                {nome}
              </Filtro>
            ))}
          </div>
        </div>

        <div data-gc="configuracoes.escolher-da-biblioteca.div--4" className="max-h-[50vh] overflow-y-auto px-5 py-4">
          {visiveis.length === 0 ? (
            <p data-gc="configuracoes.escolher-da-biblioteca.p" className="py-10 text-center text-sm text-ink-muted">
              Nenhum cursor com esse nome.
            </p>
          ) : (
            <div data-gc="configuracoes.escolher-da-biblioteca.div--5" className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
              {visiveis.map((item) => (
                <button data-gc="configuracoes.escolher-da-biblioteca.button"
                  key={item.id}
                  title={item.rotulo}
                  onClick={() => {
                    onEscolher(item.cursor);
                    onFechar();
                  }}
                  style={{
                    cursor: papel ? (comoRegra(item.cursor, papel) ?? undefined) : undefined,
                  }}
                  className="grid aspect-square place-items-center rounded-lg border border-line bg-surface-2 transition hover:border-brand hover:bg-surface-3"
                >
                  <img data-gc="configuracoes.escolher-da-biblioteca.img" src={item.cursor.imagem} alt={item.rotulo} className="size-8 object-contain" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        <p data-gc="configuracoes.escolher-da-biblioteca.p--2" className="border-t border-line px-5 py-3 text-xs text-ink-faint">
          {visiveis.length} de {BIBLIOTECA_DE_CURSORES.length} desenhos. O ponto de
          clique de cada um já vem medido.
        </p>
      </DialogContent>
    </Dialog>
  );
};

const Filtro: React.FC<{ ativo: boolean; onClick: () => void; children: React.ReactNode }> = ({
  ativo,
  onClick,
  children,
}) => (
  <button data-gc="configuracoes.escolher-da-biblioteca.button.on-click"
    onClick={onClick}
    className={cn(
      "rounded-full px-2.5 py-1 text-11 font-medium transition",
      ativo ? "bg-brand text-sobre-marca" : "bg-surface-3 text-ink-muted hover:bg-surface-4 hover:text-ink",
    )}
  >
    {children}
  </button>
);
