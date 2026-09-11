import React from "react";
import { X } from "lucide-react";

import { useBotGuilds, useRemoveBotFromGuild } from "~/@core/application/queries/bot/use-bots";
import { Button } from "~/components/ui/button";
import { useConfirm } from "~/components/ui/confirm";
import { copy } from "~/features/configuracoes/components/aplicativos/comum";

interface ServersPropsSection {
  botId: string;
  link: string;
}

export const ServersSection: React.FC<ServersPropsSection> = ({ botId, link }) => {
  const servers = useBotGuilds(botId);
  const remove = useRemoveBotFromGuild();
  const confirm = useConfirm();

  return (
    <>
      {servers.isLoading && <p data-gc="configuracoes.aplicativos.secao-de-servidores.p" className="text-sm text-ink-faint">Carregando…</p>}

      {!servers.isLoading && !servers.data?.length && (
        <p data-gc="configuracoes.aplicativos.secao-de-servidores.p--2" className="text-sm text-ink-faint">
          Esse bot ainda não está em nenhum servidor. Mande o link de convite
          pra quem tem servidor — ou use você mesmo.
        </p>
      )}

      {!!servers.data?.length && (
        <div data-gc="configuracoes.aplicativos.secao-de-servidores.div" className="overflow-hidden rounded-lg border border-line">
          {servers.data.map((server) => (
            <div data-gc="configuracoes.aplicativos.secao-de-servidores.div--2"
              key={server.id}
              className="group flex items-center gap-3 border-b border-divisor px-3 py-2.5 last:border-b-0"
            >
              {server.iconUrl ? (
                <img data-gc="configuracoes.aplicativos.secao-de-servidores.img"
                  src={server.iconUrl}
                  alt=""
                  className="size-7 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span data-gc="configuracoes.aplicativos.secao-de-servidores.span" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-4 text-10 font-bold uppercase">
                  {server.name.slice(0, 2)}
                </span>
              )}

              <span data-gc="configuracoes.aplicativos.secao-de-servidores.span--2" className="min-w-0 flex-1 truncate text-sm">{server.name}</span>

              <button data-gc="configuracoes.aplicativos.secao-de-servidores.button"
                type="button"
                onClick={() =>
                  void confirm({
                    title: `Tirar de ${server.name}?`,
                    description:
                      "O bot sai do servidor e para de responder por lá. Dá pra pôr de volta pelo link de convite.",
                    action: "Tirar",
                  }).then(
                    ({ confirmed }) =>
                      confirmed && remove.mutate({ botId, guildId: server.id }),
                  )
                }
                aria-label={`Tirar de ${server.name}`}
                title={`Tirar de ${server.name}`}
                className="shrink-0 rounded p-1 text-ink-faint opacity-0 transition hover:text-danger group-hover:opacity-100"
              >
                <X data-gc="configuracoes.aplicativos.secao-de-servidores.x" size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button data-gc="configuracoes.aplicativos.secao-de-servidores.button--2"
        variant="surface"
        size="sm"
        className="mt-4"
        onClick={() => copy(link, "Link copiado.")}
      >
        Copiar o link de convite
      </Button>
    </>
  );
};
