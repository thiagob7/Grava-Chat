import React from "react";
import { useNavigate } from "react-router";
import { ChevronRight, PhoneCall, Volume2 } from "lucide-react";

import { useAtivos } from "~/@core/application/queries/friend/use-ativos";
import { Avatar } from "~/components/Avatar";
import { Button } from "~/components/ui/button";
import { avatarColor, initials } from "~/lib/format";

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

  /*
    Agrupado por CANAL, e não por pessoa.

    Três amigos na mesma chamada rendiam três cartões repetindo o mesmo canal e
    o mesmo servidor — e nenhum deles dizia a única coisa que importa ali, que é
    "tem gente reunida neste lugar". Junto, o cartão vira o convite que ele
    sempre quis ser: as caras de quem já está, e um botão pra entrar.
  */
  const salas = new Map<string, { canal: (typeof ativos)[number]["canal"]; servidor: (typeof ativos)[number]["servidor"]; gente: typeof ativos }>();

  for (const ativo of ativos) {
    const sala = salas.get(ativo.canal.id);
    if (sala) sala.gente.push(ativo);
    else salas.set(ativo.canal.id, { canal: ativo.canal, servidor: ativo.servidor, gente: [ativo] });
  }

  return (
    <aside className="hidden w-72 shrink-0 border-l border-line p-4 xl:block">
      <h2 className="mb-3 text-sm font-semibold">Ativo agora</h2>

      {isLoading ? (
        <p className="text-sm text-ink-faint">Vendo quem está por aí…</p>
      ) : salas.size === 0 ? (
        <div className="rounded-lg bg-surface-1 p-4">
          <p className="text-sm font-medium">Está quieto por aqui…</p>
          <p className="mt-1 text-sm text-ink-muted">
            Quando um amigo entrar numa chamada, ele aparece aqui — e dá pra
            entrar junto com um clique.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...salas.values()].map(({ canal, servidor, gente }) => (
            <div key={canal.id} className="rounded-lg bg-surface-1 p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-online">
                <Volume2 size={12} className="shrink-0" /> Em voz
              </p>

              {/*
                Servidor › canal numa linha só, como um caminho.

                Antes eram duas linhas — o canal em cima, o servidor embaixo em
                cinza — e a segunda parecia legenda de rodapé em vez de "onde
                isto fica". Em caminho, a hierarquia se lê de uma passada, e
                sobra altura pro que interessa: as caras e o botão.
              */}
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
                    className="flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
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

              {/*
                Rostos sobrepostos, e o nome só quando é uma pessoa só: com duas
                ou mais, a lista de nomes ocupa três linhas e empurra o botão
                pra fora do campo de visão — e a cara já diz quem é.
              */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex -space-x-2">
                  {gente.slice(0, 5).map((ativo) => (
                    <Avatar
                      key={ativo.user.id}
                      id={ativo.user.id}
                      name={ativo.user.displayName}
                      url={ativo.user.avatarUrl}
                      size={28}
                      className="ring-2 ring-surface-1"
                    />
                  ))}
                </div>

                <span className="min-w-0 flex-1 truncate text-xs text-ink-muted">
                  {gente.length === 1 ? gente[0]!.user.displayName : `${gente.length} pessoas`}
                </span>
              </div>

              <Button
                size="sm"
                className="mt-3 w-full"
                onClick={() => navigate(`/channels/${servidor.id}/${canal.id}`)}
              >
                <PhoneCall size={14} /> Entrar na chamada
              </Button>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
};
