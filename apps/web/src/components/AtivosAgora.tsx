import React from "react";
import { useNavigate } from "react-router";
import { Volume2 } from "lucide-react";

import { useAtivos } from "~/@core/application/queries/friend/use-ativos";
import { Avatar } from "~/components/Avatar";

/*
  Coluna "Ativo agora", como a do Discord: quem dos seus amigos está num canal
  de voz, e onde.

  Só aparecem amigos em servidores que você também tem — a API filtra por isso.
  Sem esse recorte, a tela contaria onde a pessoa está em lugares que não são
  seus, o que é vazar a rotina dela fora do combinado.
*/
export const AtivosAgora: React.FC = () => {
  const { data: ativos = [], isLoading } = useAtivos();
  const navigate = useNavigate();

  return (
    <aside className="hidden w-72 shrink-0 border-l border-line p-4 xl:block">
      <h2 className="mb-3 text-sm font-semibold">Ativo agora</h2>

      {isLoading ? (
        <p className="text-sm text-ink-faint">Vendo quem está por aí…</p>
      ) : ativos.length === 0 ? (
        <div className="rounded-lg bg-surface-1 p-4">
          <p className="text-sm font-medium">Está quieto por aqui…</p>
          <p className="mt-1 text-sm text-ink-muted">
            Quando um amigo entrar numa chamada, ele aparece aqui — e dá pra
            entrar junto com um clique.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {ativos.map((ativo) => (
            <button
              key={ativo.user.id}
              onClick={() =>
                navigate(`/channels/${ativo.servidor.id}/${ativo.canal.id}`)
              }
              title={`Entrar em ${ativo.canal.nome}`}
              className="flex w-full items-center gap-3 rounded-lg bg-surface-1 p-3 text-left transition hover:bg-surface-3"
            >
              <Avatar
                id={ativo.user.id}
                name={ativo.user.displayName}
                url={ativo.user.avatarUrl}
                size={36}
                status={ativo.user.status}
              />

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {ativo.user.displayName}
                </span>
                <span className="flex items-center gap-1 truncate text-xs text-ink-muted">
                  <Volume2 size={12} className="shrink-0 text-online" />
                  {ativo.canal.nome} · {ativo.servidor.nome}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
};
