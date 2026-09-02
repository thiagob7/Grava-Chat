import React, { useMemo } from "react";
import type { GuildMember, Role } from "@gravae/shared";

import { Avatar } from "~/components/Avatar";
import { ServerTag } from "~/components/ServerTag";
import { UserName } from "~/components/UserName";
import { UserProfilePopover } from "~/components/UserProfilePopover";
import { useEnfeites, type ResolverEnfeites } from "~/hooks/use-enfeites";
import { cn } from "~/lib/utils";

interface MemberListProps {
  members: GuildMember[];
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
  roles = [],
  emVoz,
  ownerId,
  guildId,
  podeModerar = false,
}) => {
  const enfeitesDe = useEnfeites(guildId);

  const grupos = useMemo(() => {
    const hoisted = roles
      .filter((r) => r.hoist && !r.isEveryone)
      .sort((a, b) => b.position - a.position);

    const online = members.filter((m) => m.user.status !== "OFFLINE");
    const offline = members.filter((m) => m.user.status === "OFFLINE");
    const jaListados = new Set<string>();

    const seccoes = hoisted.map((role) => {
      const doCargo = online.filter((m) => !jaListados.has(m.id) && m.roleIds.includes(role.id));
      doCargo.forEach((m) => jaListados.add(m.id));

      return { titulo: `${role.name} — ${doCargo.length}`, membros: doCargo, dim: false };
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
  return (
    <aside className="topo-do-miolo hidden w-60 shrink-0 border-l border-divisor bg-surface-2 lg:block">
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
      <h3 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">{title}</h3>
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
              <ServerTag etiqueta={perfil?.etiquetaDoServidor} interativo={false} />
              {member.user.id === ownerId && <span title="Dono do servidor">👑</span>}
            </button>
          </UserProfilePopover>
        );
      })}
    </section>
  );
};
