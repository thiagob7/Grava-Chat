import React from "react";
import { X } from "lucide-react";

import { useBotGuilds, useRemoveBotFromGuild } from "~/@core/application/queries/bot/use-bots";
import { Button } from "~/components/ui/button";
import { useConfirmar } from "~/components/ui/confirm";
import { copiar } from "~/features/configuracoes/components/aplicativos/comum";

interface SecaoDeServidoresProps {
  botId: string;
  link: string;
}

export const SecaoDeServidores: React.FC<SecaoDeServidoresProps> = ({ botId, link }) => {
  const servidores = useBotGuilds(botId);
  const remover = useRemoveBotFromGuild();
  const confirmar = useConfirmar();

  return (
    <>
      {servidores.isLoading && <p data-gc="configuracoes.aplicativos.secao-de-servidores.p" className="text-sm text-ink-faint">Carregando…</p>}

      {!servidores.isLoading && !servidores.data?.length && (
        <p data-gc="configuracoes.aplicativos.secao-de-servidores.p--2" className="text-sm text-ink-faint">
          Esse bot ainda não está em nenhum servidor. Mande o link de convite
          pra quem tem servidor — ou use você mesmo.
        </p>
      )}

      {!!servidores.data?.length && (
        <div data-gc="configuracoes.aplicativos.secao-de-servidores.div" className="overflow-hidden rounded-lg border border-line">
          {servidores.data.map((servidor) => (
            <div data-gc="configuracoes.aplicativos.secao-de-servidores.div--2"
              key={servidor.id}
              className="group flex items-center gap-3 border-b border-divisor px-3 py-2.5 last:border-b-0"
            >
              {servidor.iconUrl ? (
                <img data-gc="configuracoes.aplicativos.secao-de-servidores.img"
                  src={servidor.iconUrl}
                  alt=""
                  className="size-7 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span data-gc="configuracoes.aplicativos.secao-de-servidores.span" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-4 text-10 font-bold uppercase">
                  {servidor.name.slice(0, 2)}
                </span>
              )}

              <span data-gc="configuracoes.aplicativos.secao-de-servidores.span--2" className="min-w-0 flex-1 truncate text-sm">{servidor.name}</span>

              <button data-gc="configuracoes.aplicativos.secao-de-servidores.button"
                type="button"
                onClick={() =>
                  void confirmar({
                    titulo: `Tirar de ${servidor.name}?`,
                    descricao:
                      "O bot sai do servidor e para de responder por lá. Dá pra pôr de volta pelo link de convite.",
                    acao: "Tirar",
                  }).then(
                    ({ confirmado }) =>
                      confirmado && remover.mutate({ botId, guildId: servidor.id }),
                  )
                }
                aria-label={`Tirar de ${servidor.name}`}
                title={`Tirar de ${servidor.name}`}
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
        onClick={() => copiar(link, "Link copiado.")}
      >
        Copiar o link de convite
      </Button>
    </>
  );
};
