import React, { useMemo } from "react";
import type { GuildMember, Role } from "@gravae/shared";

import { Avatar } from "~/features/perfil/components/Avatar";
import { ServerTag } from "~/features/perfil/components/ServerTag";
import { UserName } from "~/features/perfil/components/UserName";
import { UserProfilePopover } from "~/features/perfil/components/UserProfilePopover";
import { useEnfeites, type ResolverEnfeites } from "~/features/perfil/hooks/use-enfeites";
import { cn } from "~/lib/utils";
import { larguraDaLinha, Skeleton } from "~/components/ui/skeleton";
import { useTranslation } from "~/traducao";
import { useAparencia } from "~/features/configuracoes/stores/aparencia";
import { flx } from "~/lib/compat-fluxer";

interface MemberListProps {
  members: GuildMember[];
  carregando?: boolean;
  roles?: Role[];
  ownerId: string | undefined;
  guildId?: string;
  podeModerar?: boolean;
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

  if (!mostrar) return null;

  if (carregando) {
    return (
      <aside data-gc="servidor.member-list.aside"
        aria-busy
        aria-label={t("comum.carregando")}
        {...flx("listaDeMembros", "lista-de-membros hidden w-[var(--layout-member-list-width)] shrink-0 border-l border-divisor bg-surface-2 lg:block")}
      >
        <div data-gc="servidor.member-list.div" className="h-full overflow-hidden px-2 py-4">
          <Skeleton data-gc="servidor.member-list.skeleton" className="mb-3 ml-2 h-2.5 w-24 rounded-sm" />

          {Array.from({ length: 9 }, (_, i) => (
            <div data-gc="servidor.member-list.div--2" key={i} className="flex items-center gap-2 px-2 py-1.5">
              <Skeleton data-gc="servidor.member-list.skeleton--2" className="size-8 shrink-0 rounded-full" />
              <Skeleton data-gc="servidor.member-list.skeleton--3" className="h-3 rounded-sm" style={{ width: larguraDaLinha(i) }} />
            </div>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside data-gc="servidor.member-list.aside--2" {...flx("listaDeMembros", "lista-de-membros hidden w-[var(--layout-member-list-width)] shrink-0 border-l border-divisor bg-surface-2 lg:block")}>
      <div data-gc="servidor.member-list.div--3" {...flx("roladorDeMembros", "h-full overflow-y-auto px-2 py-4")}>
        {grupos.map((grupo) => (
          <MemberGroup data-gc="servidor.member-list.member-group"
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
    <section data-gc="servidor.member-list.section" className="mb-5">
      <h3 data-gc="servidor.member-list.h3" className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {title}
      </h3>
      {members.map((member) => {
        const { perfil, corDoCargo } = enfeitesDe(member.user.id);

        return (
          <UserProfilePopover data-gc="servidor.member-list.user-profile-popover"
            key={member.id}
            userId={member.user.id}
            side="left"
            guildId={guildId}
            roles={roles}
            roleIds={member.roleIds}
            podeModerar={podeModerar}
          >
            <button data-gc="servidor.member-list.button"
              className={cn(
                "flex w-full items-center gap-3 rounded px-2 py-1.5 text-left transition hover:bg-surface-3",
                dim && "opacity-40",
              )}
            >
              <Avatar data-gc="servidor.member-list.avatar"
                id={member.user.id}
                name={member.nickname ?? member.user.displayName}
                url={member.user.avatarUrl}
                size={32}
                status={member.user.status}
                emVoz={emVoz?.has(member.user.id)}
                enfeites={perfil}
              />
              <UserName data-gc="servidor.member-list.user-name"
                nome={member.nickname ?? member.user.displayName}
                perfil={perfil}
                corDoCargo={corDoCargo}
                ehBot={member.user.isBot}
                className={cn(
                  "min-w-0 truncate text-sm font-medium",
                  corDoCargo || perfil?.nome ? "" : "text-ink-muted",
                )}
              />
              <ServerTag data-gc="servidor.member-list.server-tag"
                etiqueta={perfil?.etiquetaDoServidor}
                interativo={false}
              />
              {member.user.id === ownerId && (
                <span data-gc="servidor.member-list.span" title="Dono do servidor">👑</span>
              )}
            </button>
          </UserProfilePopover>
        );
      })}
    </section>
  );
};
