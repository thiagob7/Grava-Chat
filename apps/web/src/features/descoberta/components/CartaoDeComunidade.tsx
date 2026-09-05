import React from "react";
import { Check, Loader2 } from "lucide-react";
import type { ComunidadeDescoberta } from "@gravae/shared";

import { Avatar } from "~/features/perfil/components/Avatar";
import { Button } from "~/components/ui/button";

const numero = new Intl.NumberFormat("pt-BR");

interface CartaoDeComunidadeProps {
  comunidade: ComunidadeDescoberta;
  entrando: boolean;
  onEntrar: () => void;
  onAbrir: () => void;
}

export const CartaoDeComunidade: React.FC<CartaoDeComunidadeProps> = ({
  comunidade,
  entrando,
  onEntrar,
  onAbrir,
}) => (
  <article className="group flex flex-col overflow-hidden rounded-lg border border-line bg-surface-2 transition hover:border-ink-faint/30">
    <div className="relative h-24 shrink-0 bg-surface-4">
      {comunidade.bannerUrl && (
        <img
          src={comunidade.bannerUrl}
          alt=""
          className="size-full object-cover"
          loading="lazy"
        />
      )}

      <span className="absolute -bottom-5 left-4 rounded-full ring-4 ring-surface-2">
        <Avatar
          id={comunidade.id}
          name={comunidade.name}
          url={comunidade.iconUrl}
          size={40}
        />
      </span>
    </div>

    <div className="flex min-h-0 flex-1 flex-col p-4 pt-7">
      <h3 className="truncate text-sm font-semibold">{comunidade.name}</h3>

      {comunidade.description && (
        <p className="mt-1 line-clamp-4 text-xs text-ink-muted">{comunidade.description}</p>
      )}

      <div className="mt-auto flex items-center gap-3 pt-4 text-xs text-ink-faint">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-online" />
          {numero.format(comunidade.online)} online
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-ink-faint" />
          {numero.format(comunidade.membros)} membros
        </span>
      </div>

      <div className="mt-3">
        {comunidade.jaSouMembro ? (
          <Button variant="surface" size="sm" className="w-full" onClick={onAbrir}>
            <Check size={14} /> Você já está aqui
          </Button>
        ) : (
          <Button size="sm" className="w-full" disabled={entrando} onClick={onEntrar}>
            {entrando ? <Loader2 size={14} className="animate-spin" /> : null}
            {entrando ? "Entrando…" : "Entrar"}
          </Button>
        )}
      </div>
    </div>
  </article>
);
