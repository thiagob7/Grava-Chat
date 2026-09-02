import React from "react";
import { useNavigate } from "react-router";
import { ChevronRight, PhoneCall, Volume2 } from "lucide-react";

import { useAtivos } from "~/@core/application/queries/friend/use-ativos";
import { Avatar } from "~/components/Avatar";
import { Button } from "~/components/ui/button";
import { Tooltip } from "~/components/ui/tooltip";
import { useSession } from "~/contexts/session-context";
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
  const { user } = useSession();
  const meuId = user?.id;
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
    <aside className="hidden w-72 shrink-0 border-l border-divisor bg-surface-2 p-4 xl:block">
      <h2 className="mb-3 text-sm font-semibold">Ativo agora</h2>

      {isLoading ? (
        <p className="text-sm text-ink-faint">Vendo quem está por aí…</p>
      ) : salas.size === 0 ? (
        /*
          Vazio com desenho: o cartão cinza com duas frases
          parecia um aviso de erro encostado no canto. O "zZ" grande diz que
          está tudo bem, só quieto.
        */
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
                {/*
                  O nome vive no hover de cada rosto.

                  Com os rostos sobrepostos, escrever os nomes ao lado só
                  funciona até dois — no terceiro a linha vira "Fulano, Beltrano
                  e mais 3", que não diz quem são os 3. Passar o mouse responde
                  isso um por um, sem gastar altura nenhuma.
                */}
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

              {/*
                "Entrar" numa chamada em que você já está seria mentira — e a
                pessoa que clica esperando entrar em algum lugar novo se
                assusta. Estando dentro, o cartão é só o caminho de volta.
              */}
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
