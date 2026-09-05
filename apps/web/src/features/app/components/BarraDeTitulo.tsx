import React from "react";
import { useMatch } from "react-router";

import { useFindManyGuilds } from "~/@core/application/queries/guild/use-find-many-guilds";
import { ehDesktop } from "~/lib/desktop";
import { avatarColor, initials } from "~/lib/format";

export const BarraDeTitulo: React.FC = () => {
  const rota = useMatch("/channels/:guildId/*");
  const { data: guilds = [] } = useFindManyGuilds(ehDesktop());

  if (!ehDesktop()) return null;

  const atual = guilds.find((g) => g.id === rota?.params.guildId);

  return (
    <header data-gc="app.barra-de-titulo.header" className="regiao-de-arrasto flex h-8 shrink-0 items-center justify-center bg-surface-0 px-2">
      <span data-gc="app.barra-de-titulo.span" className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-ink-muted">
        {atual ? (
          <>
            {atual.iconUrl ? (
              <img data-gc="app.barra-de-titulo.img" src={atual.iconUrl} alt="" className="size-4 shrink-0 rounded object-cover" />
            ) : (
              <span data-gc="app.barra-de-titulo.span--2"
                aria-hidden
                className="flex size-4 shrink-0 items-center justify-center rounded text-10 font-bold text-white"
                style={{ backgroundColor: avatarColor(atual.id) }}
              >
                {initials(atual.name)}
              </span>
            )}
            <span data-gc="app.barra-de-titulo.span--3" className="truncate">{atual.name}</span>
          </>
        ) : (
          "Gravaê"
        )}
      </span>
    </header>
  );
};
