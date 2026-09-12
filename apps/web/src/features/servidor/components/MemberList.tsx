import React, { useMemo } from "react";
import type { GuildMember, Role } from "@gravae/shared";

import { Avatar } from "~/features/perfil/components/Avatar";
import { ServerTag } from "~/features/perfil/components/ServerTag";
import { UserName } from "~/features/perfil/components/UserName";
import { UserProfilePopover } from "~/features/perfil/components/UserProfilePopover";
import { useCharms, type ResolveCharms } from "~/features/perfil/hooks/use-enfeites";
import { cn } from "~/lib/utils";
import { lineWidth, Skeleton } from "~/components/ui/skeleton";
import { useTranslation } from "~/traducao";
import { useAppearance } from "~/features/configuracoes/stores/aparencia";
import { flx, flxCls } from "~/lib/compat-de-tema";

interface MemberListProps {
  members: GuildMember[];
  loading?: boolean;
  roles?: Role[];
  ownerId: string | undefined;
  guildId?: string;
  canModerate?: boolean;
  fluid?: boolean;
}

export const MemberList: React.FC<MemberListProps> = ({
  members,
  loading = false,
  roles = [],
  ownerId,
  guildId,
  canModerate = false,
  fluid = false,
}) => {
  const { t } = useTranslation();
  const charms = useCharms(guildId);

  const show = useAppearance((s) => s.listMembers);

  const groups = useMemo(() => {
    const hoisted = roles
      .filter((r) => r.hoist && !r.isEveryone)
      .sort((a, b) => b.position - a.position);

    const online = members.filter((m) => m.user.status !== "OFFLINE");
    const offline = members.filter((m) => m.user.status === "OFFLINE");
    const alreadyListed = new Set<string>();

    const sections = hoisted.map((role) => {
      const fromRole = online.filter(
        (m) => !alreadyListed.has(m.id) && m.roleIds.includes(role.id),
      );
      fromRole.forEach((m) => alreadyListed.add(m.id));

      return {
        title: `${role.name} — ${fromRole.length}`,
        members: fromRole,
        dim: false,
      };
    });

    const remaining = online.filter((m) => !alreadyListed.has(m.id));

    return [
      ...sections.filter((s) => s.members.length),
      { title: `Online — ${remaining.length}`, members: remaining, dim: false },
      { title: `Offline — ${offline.length}`, members: offline, dim: true },
    ];
  }, [members, roles]);

  if (!show && !fluid) return null;

  if (loading) {
    return (
      <aside data-gc="servidor.member-list.aside"
        aria-busy
        aria-label={t("comum.carregando")}
        {...flx("listMembers", cn(
          "lista-de-membros relative bg-surface-2",
          fluid
            ? "flex min-h-0 w-full flex-1 flex-col"
            : "hidden w-[var(--layout-member-list-width)] shrink-0 lg:block",
        ))}
      >
        <div data-gc="servidor.member-list.div" aria-hidden {...flx("membersDivider", "absolute inset-y-0 left-0 w-px bg-line")} />
        <div data-gc="servidor.member-list.div--2" className="h-full overflow-hidden px-2 py-4">
          <Skeleton data-gc="servidor.member-list.skeleton" className="mb-3 ml-2 h-2.5 w-24 rounded-sm" />

          {Array.from({ length: 9 }, (_, i) => (
            <div data-gc="servidor.member-list.div--3" key={i} className="flex items-center gap-2 px-2 py-1.5">
              <Skeleton data-gc="servidor.member-list.skeleton--2" className="size-8 shrink-0 rounded-full" />
              <Skeleton data-gc="servidor.member-list.skeleton--3" className="h-3 rounded-sm" style={{ width: lineWidth(i) }} />
            </div>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside data-gc="servidor.member-list.aside--2" {...flx("listMembers", cn(
          "lista-de-membros relative bg-surface-2",
          fluid
            ? "flex min-h-0 w-full flex-1 flex-col"
            : "hidden w-[var(--layout-member-list-width)] shrink-0 lg:block",
        ))}>
      <div data-gc="servidor.member-list.div--4" aria-hidden {...flx("membersDivider", "absolute inset-y-0 left-0 w-px bg-line")} />
      <div data-gc="servidor.member-list.div--5" {...flx("membersScroller", cn("h-full overflow-y-auto px-2 py-4", flxCls("listMembersContent")))}>
        {groups.map((group) => (
          <MemberGroup data-gc="servidor.member-list.member-group"
            key={group.title}
            title={group.title}
            members={group.members}
            roles={roles}
            ownerId={ownerId}
            dim={group.dim}
            guildId={guildId}
            canModerate={canModerate}
            charms={charms}
          />
        ))}
      </div>
    </aside>
  );
};

interface MemberGroupProps extends MemberListProps {
  title: string;
  dim?: boolean;
  charms: ResolveCharms;
}

const MemberGroup: React.FC<MemberGroupProps> = ({
  title,
  members,
  roles = [],
  ownerId,
  dim,
  guildId,
  canModerate = false,
  charms,
}) => {
  if (!members.length) return null;

  return (
    <section data-gc="servidor.member-list.section" className="mb-5">
      <h3 data-gc="servidor.member-list.h3" className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {title}
      </h3>
      {members.map((member) => {
        const { profile, roleColor } = charms(member.user.id);

        return (
          <UserProfilePopover data-gc="servidor.member-list.user-profile-popover"
            key={member.id}
            userId={member.user.id}
            side="left"
            guildId={guildId}
            roles={roles}
            roleIds={member.roleIds}
            canModerate={canModerate}
          >
            <button data-gc="servidor.member-list.button"
              data-gc-usuario={member.user.id}
              className={cn(
                "flex w-full items-center gap-2.5 rounded px-2 py-1 text-left transition hover:bg-surface-3",
                flxCls("memberLine"),
                flxCls("memberItem"),
                flxCls("memberButton"),
                dim && cn("opacity-40", flxCls("memberOfflineButton")),
              )}
            >
              <Avatar data-gc="servidor.member-list.avatar"
                id={member.user.id}
                name={member.nickname ?? member.user.displayName}
                url={member.user.avatarUrl}
                size={32}
                status={member.user.status}
                charms={profile}
                className={flxCls("memberAvatar")}
              />
              <UserName data-gc="servidor.member-list.user-name"
                name={member.nickname ?? member.user.displayName}
                profile={profile}
                roleColor={roleColor}
                isBot={member.user.isBot}
                isSystem={member.user.system}
                seal="sm"
                className={cn(
                  "min-w-0 truncate text-sm font-medium",
                  flxCls("memberName"),
                  roleColor || profile?.name ? "" : "text-ink-muted",
                )}
              />
              <ServerTag data-gc="servidor.member-list.server-tag"
                tag={profile?.serverTag}
                interactive={false}
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
