import React, { useState } from "react";
import { Pencil } from "lucide-react";
import { LIMITS } from "@gravae/shared";

import { useDefinirStatusDoCanal } from "~/@core/application/queries/guild/use-status-do-canal";
import { Button } from "~/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

export const StatusDoCanal: React.FC<{
  guildId: string;
  channelId: string;
  nomeDoCanal: string;
  status: string | null | undefined;
  podeEditar: boolean;
  className?: string;
}> = ({ guildId, channelId, nomeDoCanal, status, podeEditar, className }) => {
  const [editando, setEditando] = useState(false);

  if (!status && !podeEditar) return null;

  return (
    <>
      <span data-gc="servidor.status-do-canal.span"
        role={podeEditar ? "button" : undefined}
        tabIndex={podeEditar ? 0 : undefined}
        onClick={
          podeEditar
            ? (e) => {
                e.stopPropagation();
                setEditando(true);
              }
            : undefined
        }
        className={cn(
          "flex min-w-0 items-center gap-1 text-11 leading-4",
          status ? "text-ink-muted" : "text-ink-faint",
          podeEditar && "hover:text-ink",
          className,
        )}
      >
        <span data-gc="servidor.status-do-canal.span--2" className="truncate">{status ?? "Definir um status do canal"}</span>
        {podeEditar && <Pencil data-gc="servidor.status-do-canal.pencil" size={10} className="shrink-0" />}
      </span>

      {editando && (
        <Editor data-gc="servidor.status-do-canal.editor"
          guildId={guildId}
          channelId={channelId}
          nomeDoCanal={nomeDoCanal}
          status={status ?? ""}
          onFechar={() => setEditando(false)}
        />
      )}
    </>
  );
};

const Editor: React.FC<{
  guildId: string;
  channelId: string;
  nomeDoCanal: string;
  status: string;
  onFechar: () => void;
}> = ({ guildId, channelId, nomeDoCanal, status, onFechar }) => {
  const definir = useDefinirStatusDoCanal();
  const [texto, setTexto] = useState(status);

  const salvar = () =>
    definir.mutate(
      { guildId, channelId, status: texto.trim() || null },
      { onSuccess: onFechar },
    );

  return (
    <Dialog data-gc="servidor.status-do-canal.dialog" open onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent data-gc="servidor.status-do-canal.dialog-content" className="max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader data-gc="servidor.status-do-canal.dialog-header">
          <DialogTitle data-gc="servidor.status-do-canal.dialog-title">Status de {nomeDoCanal}</DialogTitle>
        </DialogHeader>

        <DialogBody data-gc="servidor.status-do-canal.dialog-body" className="space-y-3">
          <p data-gc="servidor.status-do-canal.p" className="text-sm text-ink-muted">
            Diga o que está rolando na chamada. Quem vê o canal na lista lê isto embaixo do nome.
          </p>

          <Input data-gc="servidor.status-do-canal.input"
            autoFocus
            value={texto}
            maxLength={LIMITS.statusDoCanal}
            placeholder="Jogando, estudando, reunião…"
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && salvar()}
          />
        </DialogBody>

        <DialogFooter data-gc="servidor.status-do-canal.dialog-footer">
          {status && (
            <Button data-gc="servidor.status-do-canal.button"
              variant="surface"
              className="mr-auto"
              disabled={definir.isPending}
              onClick={() =>
                definir.mutate({ guildId, channelId, status: null }, { onSuccess: onFechar })
              }
            >
              Limpar
            </Button>
          )}

          <Button data-gc="servidor.status-do-canal.button.on-fechar" variant="surface" onClick={onFechar}>
            Cancelar
          </Button>

          <Button data-gc="servidor.status-do-canal.button.salvar" disabled={definir.isPending} onClick={salvar}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
