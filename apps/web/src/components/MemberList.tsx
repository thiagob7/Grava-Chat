import React, { useMemo } from "react";
import type { GuildMember, Role } from "@gravae/shared";

import { Avatar } from "~/components/Avatar";
import { ServerTag } from "~/components/ServerTag";
import { UserName } from "~/components/UserName";
import { UserProfilePopover } from "~/components/UserProfilePopover";
import { useEnfeites, type ResolverEnfeites } from "~/hooks/use-enfeites";
import { cn } from "~/lib/utils";
import { larguraDaLinha, Skeleton } from "~/components/ui/skeleton";
import { useTranslation } from "~/traducao";
import { useAparencia } from "~/stores/aparencia";

interface MemberListProps {
  members: GuildMember[];
  carregando?: boolean;
  roles?: Role[];
  ownerId: string | undefined;
  guildId?: string;
  podeModerar?: boolean;
  /*
    Quem está num canal de voz deste servidor agora.

    A lista de membros diz quem ESTÁ, e a bolinha diz em que estado — mas
    "online" e "online numa chamada com três pessoas" são coisas bem
    diferentes na hora de decidir se você entra ou não. O alto-falante responde
    isso sem precisar caçar canal por canal na barra da esquerda.
  */
  emVoz?: Set<string>;
}

export const MemberList: React.FC<MemberListProps> = ({
  members,
  carregando = false,
  roles = [],
  emVoz,
  ownerId,
  guildId,
  podeModerar = false,
}) => {
  const { t } = useTranslation();
  const enfeitesDe = useEnfeites(guildId);

  /*
    A coluna some por decisão de quem usa, e não só por largura de tela.

    Ela já sumia sozinha abaixo de `lg` — o que faltava era o caso de quem tem
    tela larga e prefere a conversa ocupando tudo. A guarda vem depois dos
    hooks de propósito: sair antes deles muda a quantidade de hooks entre uma
    renderização e outra, que é o erro que o React não perdoa.
  */
  const mostrar = useAparencia((s) => s.listaDeMembros);

  const grupos = useMemo(() => {
    const hoisted = roles
      .filter((r) => r.hoist && !r.isEveryone)
      .sort((a, b) => b.position - a.position);

    const online = members.filter((m) => m.user.status !== "OFFLINE");
    const offline = members.filter((m) => m.user.status === "OFFLINE");
    const jaListados = new Set<string>();

    const seccoes = hoisted.map((role) => {
      const doCargo = online.filter(
        (m) => !jaListados.has(m.id) && m.roleIds.includes(role.id),
      );
      doCargo.forEach((m) => jaListados.add(m.id));

      return {
        titulo: `${role.name} — ${doCargo.length}`,
        membros: doCargo,
        dim: false,
      };
    });

    const restante = online.filter((m) => !jaListados.has(m.id));

    return [
      ...seccoes.filter((s) => s.membros.length),
      { titulo: `Online — ${restante.length}`, membros: restante, dim: false },
      { titulo: `Offline — ${offline.length}`, membros: offline, dim: true },
    ];
  }, [members, roles]);

  /*
    240px e ponto, como no Discord.

    Ela já foi arrastável. Redimensionar a lista de gente não resolve problema
    nenhum — ninguém precisa de nome de pessoa em 400px — e custava caro: a
    alça ficava colada na barra de rolagem do chat, então arrastar a rolagem
    puxava a coluna junto.
  */
  if (!mostrar) return null;

  /*
    A lista de membros não tinha estado de carregamento nenhum: ela nascia
    vazia e as pessoas apareciam de uma vez. Numa entrada de servidor grande
    isso é uma coluna em branco por um segundo, indistinguível de um servidor
    sem ninguém.
  */
  if (carregando) {
    return (
      <aside
        aria-busy
        aria-label={t("comum.carregando")}
        className="hidden w-60 shrink-0 border-l border-divisor bg-surface-2 lg:block"
      >
        <div className="h-full overflow-hidden px-2 py-4">
          <Skeleton className="mb-3 ml-2 h-2.5 w-24 rounded-sm" />

          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-1.5">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <Skeleton className="h-3 rounded-sm" style={{ width: larguraDaLinha(i) }} />
            </div>
          ))}
        </div>
      </aside>
    );
  }

  /*
    Sem `topo-do-miolo` desde que o cabeçalho passou a atravessar a largura
    toda: o fio de 1px daquela classe marca o alto do MIOLO, e o alto do miolo
    agora é o cabeçalho. Mantê-lo aqui desenharia um segundo fio logo abaixo do
    primeiro.
  */
  return (
    <aside className="hidden w-60 shrink-0 border-l border-divisor bg-surface-2 lg:block">
      <div className="h-full overflow-y-auto px-2 py-4">
        {grupos.map((grupo) => (
          <MemberGroup
            key={grupo.titulo}
            title={grupo.titulo}
            members={grupo.membros}
            roles={roles}
            ownerId={ownerId}
            dim={grupo.dim}
            guildId={guildId}
            podeModerar={podeModerar}
            emVoz={emVoz}
            enfeitesDe={enfeitesDe}
          />
        ))}
      </div>
    </aside>
  );
};

interface MemberGroupProps extends MemberListProps {
  title: string;
  dim?: boolean;
  enfeitesDe: ResolverEnfeites;
}

const MemberGroup: React.FC<MemberGroupProps> = ({
  title,
  members,
  roles = [],
  ownerId,
  dim,
  guildId,
  podeModerar = false,
  emVoz,
  enfeitesDe,
}) => {
  if (!members.length) return null;

  return (
    <section className="mb-5">
      <h3 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {title}
      </h3>
      {members.map((member) => {
        const { perfil, corDoCargo } = enfeitesDe(member.user.id);

        return (
          <UserProfilePopover
            key={member.id}
            userId={member.user.id}
            side="left"
            guildId={guildId}
            roles={roles}
            roleIds={member.roleIds}
            podeModerar={podeModerar}
          >
            <button
              className={cn(
                "flex w-full items-center gap-3 rounded px-2 py-1.5 text-left transition hover:bg-surface-3",
                dim && "opacity-40",
              )}
            >
              <Avatar
                id={member.user.id}
                name={member.nickname ?? member.user.displayName}
                url={member.user.avatarUrl}
                size={32}
                status={member.user.status}
                emVoz={emVoz?.has(member.user.id)}
                enfeites={perfil}
              />
              <UserName
                nome={member.nickname ?? member.user.displayName}
                perfil={perfil}
                corDoCargo={corDoCargo}
                ehBot={member.user.isBot}
                className={cn(
                  "min-w-0 truncate text-sm font-medium",
                  corDoCargo || perfil?.nome ? "" : "text-ink-muted",
                )}
              />
              <ServerTag
                etiqueta={perfil?.etiquetaDoServidor}
                interativo={false}
              />
              {member.user.id === ownerId && (
                <span title="Dono do servidor">👑</span>
              )}
            </button>
          </UserProfilePopover>
        );
      })}
    </section>
  );
};
