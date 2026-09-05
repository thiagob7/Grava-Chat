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
  <article data-gc="descoberta.cartao-de-comunidade.article" className="group flex flex-col overflow-hidden rounded-lg border border-line bg-surface-2 transition hover:border-ink-faint/30">
    <div data-gc="descoberta.cartao-de-comunidade.div" className="relative h-24 shrink-0 bg-surface-4">
      {comunidade.bannerUrl && (
        <img data-gc="descoberta.cartao-de-comunidade.img"
          src={comunidade.bannerUrl}
          alt=""
          className="size-full object-cover"
          loading="lazy"
        />
      )}

      <span data-gc="descoberta.cartao-de-comunidade.span" className="absolute -bottom-5 left-4 rounded-full ring-4 ring-surface-2">
        <Avatar data-gc="descoberta.cartao-de-comunidade.avatar"
          id={comunidade.id}
          name={comunidade.name}
          url={comunidade.iconUrl}
          size={40}
        />
      </span>
    </div>

    <div data-gc="descoberta.cartao-de-comunidade.div--2" className="flex min-h-0 flex-1 flex-col p-4 pt-7">
      <h3 data-gc="descoberta.cartao-de-comunidade.h3" className="truncate text-sm font-semibold">{comunidade.name}</h3>

      {comunidade.description && (
        <p data-gc="descoberta.cartao-de-comunidade.p" className="mt-1 line-clamp-4 text-xs text-ink-muted">{comunidade.description}</p>
      )}

      <div data-gc="descoberta.cartao-de-comunidade.div--3" className="mt-auto flex items-center gap-3 pt-4 text-xs text-ink-faint">
        <span data-gc="descoberta.cartao-de-comunidade.span--2" className="flex items-center gap-1.5">
          <span data-gc="descoberta.cartao-de-comunidade.span--3" className="size-1.5 rounded-full bg-online" />
          {numero.format(comunidade.online)} online
        </span>
        <span data-gc="descoberta.cartao-de-comunidade.span--4" className="flex items-center gap-1.5">
          <span data-gc="descoberta.cartao-de-comunidade.span--5" className="size-1.5 rounded-full bg-ink-faint" />
          {numero.format(comunidade.membros)} membros
        </span>
      </div>

      <div data-gc="descoberta.cartao-de-comunidade.div--4" className="mt-3">
        {comunidade.jaSouMembro ? (
          <Button data-gc="descoberta.cartao-de-comunidade.button.on-abrir" variant="surface" size="sm" className="w-full" onClick={onAbrir}>
            <Check data-gc="descoberta.cartao-de-comunidade.check" size={14} /> Você já está aqui
          </Button>
        ) : (
          <Button data-gc="descoberta.cartao-de-comunidade.button.on-entrar" size="sm" className="w-full" disabled={entrando} onClick={onEntrar}>
            {entrando ? <Loader2 data-gc="descoberta.cartao-de-comunidade.loader2" size={14} className="animate-spin" /> : null}
            {entrando ? "Entrando…" : "Entrar"}
          </Button>
        )}
      </div>
    </div>
  </article>
);
