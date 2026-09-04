import React from "react";
import { useNavigate } from "react-router";
import { ChevronRight, PhoneCall, Volume2 } from "lucide-react";

import { useAtivos } from "~/@core/application/queries/friend/use-ativos";
import { Avatar } from "~/components/Avatar";
import { Button } from "~/components/ui/button";
import { Tooltip } from "~/components/ui/tooltip";
import { useSession } from "~/contexts/session-context";
import { avatarColor, initials } from "~/lib/format";

export const AtivosAgora: React.FC = () => {
  const { data: ativos = [], isLoading } = useAtivos();
  const { user } = useSession();
  const meuId = user?.id;
  const navigate = useNavigate();

  const salas = new Map<string, { canal: (typeof ativos)[number]["canal"]; servidor: (typeof ativos)[number]["servidor"]; gente: typeof ativos }>();

  for (const ativo of ativos) {
    const sala = salas.get(ativo.canal.id);
    if (sala) sala.gente.push(ativo);
    else salas.set(ativo.canal.id, { canal: ativo.canal, servidor: ativo.servidor, gente: [ativo] });
  }

  return (
    <aside className="hidden w-72 shrink-0 border-l border-divisor bg-surface-2 p-4 xl:block">
      <h2 className="mb-3 text-sm font-semibold">Ativo agora</h2>

      {isLoading ? (
        <p className="text-sm text-ink-faint">Vendo quem está por aí…</p>
      ) : salas.size === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-2 py-24 text-center">
          <span aria-hidden className="text-3xl font-bold text-ink-faint/60">
            z<span className="align-super text-xl">Z</span>
          </span>

          <p className="text-sm font-semibold">Está tudo tranquilo por enquanto…</p>
          <p className="text-xs leading-relaxed text-ink-muted">
            Quando você ou um amigo entrar numa chamada, ela aparece aqui — e dá pra entrar junto
            com um clique.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...salas.values()].map(({ canal, servidor, gente }) => (
            <div key={canal.id} className="rounded-lg bg-surface-1 p-3">
              <p className="flex items-center gap-1.5 text-11 font-semibold uppercase tracking-wide text-online">
                <Volume2 size={12} className="shrink-0" /> Em voz
              </p>

              <button
                onClick={() => navigate(`/channels/${servidor.id}/${canal.id}`)}
                title={`Abrir ${canal.nome} em ${servidor.nome}`}
                className="mt-2 flex w-full min-w-0 items-center gap-1.5 text-left"
              >
                {servidor.iconUrl ? (
                  <img
                    src={servidor.iconUrl}
                    alt=""
                    className="size-5 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="flex size-5 shrink-0 items-center justify-center rounded-full text-10 font-bold text-white"
                    style={{ backgroundColor: avatarColor(servidor.id) }}
                  >
                    {initials(servidor.nome)}
                  </span>
                )}

                <ChevronRight size={12} className="shrink-0 text-ink-faint" />
                <Volume2 size={13} className="shrink-0 text-ink-muted" />

                <span className="min-w-0 truncate text-sm font-medium hover:underline">
                  {canal.nome}
                </span>
              </button>

              <div className="mt-3 flex items-center gap-2">
                <div className="flex -space-x-2">
                  {gente.slice(0, 5).map((ativo) => (
                    <Tooltip
                      key={ativo.user.id}
                      label={ativo.user.id === meuId ? "Você" : ativo.user.displayName}
                    >
                      <span className="rounded-full">
                        <Avatar
                          id={ativo.user.id}
                          name={ativo.user.displayName}
                          url={ativo.user.avatarUrl}
                          size={28}
                          className="ring-2 ring-surface-1"
                        />
                      </span>
                    </Tooltip>
                  ))}
                </div>

                <span className="min-w-0 flex-1 truncate text-xs text-ink-muted">
                  {gente.length === 1
                    ? gente[0]!.user.id === meuId
                      ? "Só você"
                      : gente[0]!.user.displayName
                    : `${gente.length} pessoas`}
                </span>
              </div>

              <Button
                size="sm"
                className="mt-3 w-full"
                onClick={() => navigate(`/channels/${servidor.id}/${canal.id}`)}
              >
                <PhoneCall size={14} />
                {gente.some((a) => a.user.id === meuId) ? "Voltar para a chamada" : "Entrar na chamada"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
};
