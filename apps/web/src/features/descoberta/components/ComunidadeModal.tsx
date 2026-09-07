import React from "react";
import { Loader2 } from "lucide-react";
import type { ComunidadeDescoberta } from "@gravae/shared";

import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";
import { Avatar } from "~/features/perfil/components/Avatar";
import { SeloDaComunidade } from "~/features/servidor/components/SeloDaComunidade";

const numero = new Intl.NumberFormat("pt-BR");

/// A comunidade em detalhe, antes de entrar: o que o cartão corta, aqui cabe.
export const ComunidadeModal: React.FC<{
  comunidade: ComunidadeDescoberta | null;
  entrando: boolean;
  onFechar: () => void;
  onEntrar: (comunidade: ComunidadeDescoberta) => void;
  onAbrir: (comunidade: ComunidadeDescoberta) => void;
}> = ({ comunidade, entrando, onFechar, onEntrar, onAbrir }) => (
  <Dialog data-gc="descoberta.comunidade-modal.dialog" open={comunidade !== null} onOpenChange={(aberto) => !aberto && onFechar()}>
    <DialogContent data-gc="descoberta.comunidade-modal.dialog-content" className="max-w-md">
      {comunidade && (
        <div data-gc="descoberta.comunidade-modal.div" className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
          <Avatar data-gc="descoberta.comunidade-modal.avatar" id={comunidade.id} name={comunidade.name} url={comunidade.iconUrl} size={72} />

          <p data-gc="descoberta.comunidade-modal.p" className="mt-4 text-sm text-ink-muted">Comunidade pública</p>

          <DialogTitle data-gc="descoberta.comunidade-modal.dialog-title" className="mt-1 flex items-center justify-center gap-2 text-2xl font-bold leading-tight">
            <span data-gc="descoberta.comunidade-modal.span">{comunidade.name}</span>
            <SeloDaComunidade data-gc="descoberta.comunidade-modal.selo-da-comunidade" verificada={comunidade.verificada} detectavel tamanho={20} />
          </DialogTitle>

          <p data-gc="descoberta.comunidade-modal.p--2" className="mt-2 flex items-center gap-4 text-sm text-ink-muted">
            <span data-gc="descoberta.comunidade-modal.span--2" className="flex items-center gap-1.5">
              <span data-gc="descoberta.comunidade-modal.span--3" className="size-2 rounded-full bg-online" />
              {numero.format(comunidade.online)} online
            </span>
            <span data-gc="descoberta.comunidade-modal.span--4" className="flex items-center gap-1.5">
              <span data-gc="descoberta.comunidade-modal.span--5" className="size-2 rounded-full bg-ink-faint" />
              {numero.format(comunidade.membros)} membros
            </span>
          </p>

          {comunidade.description && (
            <p data-gc="descoberta.comunidade-modal.p--3" className="mt-4 max-w-sm text-sm text-ink-muted">{comunidade.description}</p>
          )}

          {comunidade.jaSouMembro ? (
            <Button data-gc="descoberta.comunidade-modal.button" variant="surface" className="mt-8 w-full" onClick={() => onAbrir(comunidade)}>
              Abrir a comunidade
            </Button>
          ) : (
            <Button data-gc="descoberta.comunidade-modal.button--2" className="mt-8 w-full" disabled={entrando} onClick={() => onEntrar(comunidade)}>
              {entrando ? <Loader2 data-gc="descoberta.comunidade-modal.loader2" size={14} className="animate-spin" /> : null}
              {entrando ? "Entrando…" : "Entrar na comunidade"}
            </Button>
          )}
        </div>
      )}
    </DialogContent>
  </Dialog>
);
