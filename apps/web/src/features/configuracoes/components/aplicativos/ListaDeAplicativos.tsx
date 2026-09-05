import React from "react";
import { ChevronRight } from "lucide-react";

import type { BotModel } from "~/@core/application/requests/bot/bots";
import { Avatar } from "~/features/perfil/components/Avatar";
import { formatShortDate } from "~/lib/format";

interface ListaDeAplicativosProps {
  bots: BotModel[];
  onAbrir: (botId: string) => void;
}

export const ListaDeAplicativos: React.FC<ListaDeAplicativosProps> = ({ bots, onAbrir }) => (
  <div data-gc="configuracoes.aplicativos.lista-de-aplicativos.div" className="overflow-hidden rounded-lg border border-line">
    {bots.map((bot) => (
      <button data-gc="configuracoes.aplicativos.lista-de-aplicativos.button"
        key={bot.id}
        type="button"
        onClick={() => onAbrir(bot.id)}
        className="flex w-full items-center gap-3 border-b border-divisor px-3 py-2.5 text-left transition last:border-b-0 hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/60"
      >
        <Avatar data-gc="configuracoes.aplicativos.lista-de-aplicativos.avatar"
          id={bot.usuario.id}
          name={bot.usuario.displayName}
          url={bot.usuario.avatarUrl}
          size={32}
        />

        <span data-gc="configuracoes.aplicativos.lista-de-aplicativos.span" className="min-w-0 flex-1">
          <span data-gc="configuracoes.aplicativos.lista-de-aplicativos.span--2" className="block truncate text-sm font-medium">
            {bot.usuario.displayName}
          </span>
          <span data-gc="configuracoes.aplicativos.lista-de-aplicativos.span--3" className="mt-0.5 block truncate text-xs text-ink-faint">
            @{bot.usuario.username} · Criado em {formatShortDate(bot.createdAt)}
          </span>
        </span>

        <ChevronRight data-gc="configuracoes.aplicativos.lista-de-aplicativos.chevron-right" size={18} className="shrink-0 text-ink-faint" />
      </button>
    ))}
  </div>
);
