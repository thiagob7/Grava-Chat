import React, { useMemo, useState } from "react";
import { Checkbox } from "~/components/ui/checkbox";
import {
  ArrowUpDown,
  Ban,
  Clock,
  MoreVertical,
  Search,
  UserX,
} from "lucide-react";
import type { GuildMember, Role } from "@gravae/shared";

import { OwnerSeal } from "~/features/servidor/components/SeloDeDono";
import { useRemoveMember } from "~/@core/application/queries/guild/use-remove-member";
import {
  useBanMember,
  useTimeoutMember,
} from "~/@core/application/queries/moderation/use-moderation";
import { useSetMemberRoles } from "~/@core/application/queries/role/use-set-member-roles";
import type { GuildModel } from "~/@core/domain/models/guild-model";
import { Avatar } from "~/features/perfil/components/Avatar";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { useConfirm } from "~/components/ui/confirm";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

interface MembersSectionProps {
  guild: GuildModel;
  members: GuildMember[];
  roles: Role[];
  currentUserId: string | undefined;
  canKick: boolean;
  canBan: boolean;
  canTimeout: boolean;
  canManageRoles: boolean;
}

type Order = "recentes" | "antigos" | "nome";

const TIMEOUTS = [
  { minutes: 5, key: "servidor.membros.castigo5min" },
  { minutes: 60, key: "servidor.membros.castigo1h" },
  { minutes: 60 * 24, key: "servidor.membros.castigo1d" },
  { minutes: 60 * 24 * 7, key: "servidor.membros.castigo1s" },
];

export const MembersSection: React.FC<MembersSectionProps> = ({
  guild,
  members,
  roles,
  currentUserId,
  canKick,
  canBan,
  canTimeout,
  canManageRoles,
}) => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const removeMember = useRemoveMember();
  const ban = useBanMember(guild.id);
  const timeout = useTimeoutMember(guild.id);
  const setRoles = useSetMemberRoles(guild.id);

  const [search, setSearch] = useState("");
  const [order, setOrder] = useState<Order>("recentes");

  const name = (member: GuildMember) =>
    member.nickname ?? member.user.displayName;

  const kick = async (member: GuildMember) => {
    const { confirmed } = await confirm({
      title: t("servidor.membros.expulsarTitulo", { nome: name(member) }),
      description: (
        <>
          <strong data-gc="servidor.server-settings.members-section.strong">{name(member)}</strong>{" "}
          {t("servidor.membros.expulsarDescricao", { servidor: guild.name })}
        </>
      ),
      action: t("servidor.membros.expulsar"),
    });

    if (confirmed)
      removeMember.mutate({ guildId: guild.id, userId: member.user.id });
  };

  const banMember = async (member: GuildMember) => {
    const { confirmed, text } = await confirm({
      title: t("servidor.membros.banirTitulo", { nome: name(member) }),
      description: (
        <>
          <strong data-gc="servidor.server-settings.members-section.strong--2">{name(member)}</strong>{" "}
          {t("servidor.membros.banirDescricao", { servidor: guild.name })}
        </>
      ),
      action: t("servidor.membros.banir"),
      field: {
        label: t("servidor.membros.motivo"),
        placeholder: t("servidor.membros.motivoDica"),
      },
    });

    if (confirmed) {
      ban.mutate({
        guildId: guild.id,
        userId: member.user.id,
        reason: text || null,
      });
    }
  };

  const list = useMemo(() => {
    const term = search.trim().toLowerCase();

    const filtered = term
      ? members.filter(
          (m) =>
            m.user.displayName.toLowerCase().includes(term) ||
            m.user.username.toLowerCase().includes(term),
        )
      : [...members];

    return filtered.sort((a, b) => {
      if (order === "nome")
        return a.user.displayName.localeCompare(b.user.displayName);

      const tempoA = new Date(a.joinedAt).getTime();
      const tempoB = new Date(b.joinedAt).getTime();

      return order === "recentes" ? tempoB - tempoA : tempoA - tempoB;
    });
  }, [members, search, order]);

  return (
    <div data-gc="servidor.server-settings.members-section.div" className="max-w-4xl pb-10">
      <h2 data-gc="servidor.server-settings.members-section.h2" className="text-xl font-semibold">
        Membros do servidor — {members.length}
      </h2>

      <div data-gc="servidor.server-settings.members-section.div--2" className="mt-4 flex items-center gap-3">
        <div data-gc="servidor.server-settings.members-section.div--3" className="flex flex-1 items-center gap-2 rounded bg-surface-0 px-3">
          <Search data-gc="servidor.server-settings.members-section.search" size={16} className="text-ink-faint" />
          <Input data-gc="servidor.server-settings.members-section.input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("servidor.membros.procurar")}
            className="bg-transparent px-0"
          />
        </div>

        <Button data-gc="servidor.server-settings.members-section.button"
          variant="surface"
          size="sm"
          onClick={() =>
            setOrder((current) =>
              current === "recentes"
                ? "antigos"
                : current === "antigos"
                  ? "nome"
                  : "recentes",
            )
          }
        >
          <ArrowUpDown data-gc="servidor.server-settings.members-section.arrow-up-down" size={14} />
          {order === "recentes"
            ? "Mais recentes"
            : order === "antigos"
              ? "Mais antigos"
              : "Nome"}
        </Button>
      </div>

      <table data-gc="servidor.server-settings.members-section.table" className="mt-4 w-full">
        <thead data-gc="servidor.server-settings.members-section.thead">
          <tr data-gc="servidor.server-settings.members-section.tr" className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-faint">
            <th data-gc="servidor.server-settings.members-section.th" className="pb-2 font-semibold">{t("comum.nome")}</th>
            <th data-gc="servidor.server-settings.members-section.th--2" className="pb-2 font-semibold">{t("servidor.membros.membroDesde")}</th>
            <th data-gc="servidor.server-settings.members-section.th--3" className="pb-2 font-semibold">{t("servidor.cargos.titulo")}</th>
            <th data-gc="servidor.server-settings.members-section.th--4" />
          </tr>
        </thead>

        <tbody data-gc="servidor.server-settings.members-section.tbody">
          {list.map((member) => {
            const isOwner = member.user.id === guild.ownerId;
            const euSame = member.user.id === currentUserId;
            const roleList = roles.filter(
              (r) => !r.isEveryone && member.roleIds.includes(r.id),
            );
            const fromTimeout =
              member.timeoutUntil && new Date(member.timeoutUntil) > new Date()
                ? new Date(member.timeoutUntil)
                : null;

            return (
              <tr data-gc="servidor.server-settings.members-section.tr--2"
                key={member.id}
                className="group border-b border-line align-middle"
              >
                <td data-gc="servidor.server-settings.members-section.td" className="py-3">
                  <div data-gc="servidor.server-settings.members-section.div--4" className="flex items-center gap-3">
                    <Avatar data-gc="servidor.server-settings.members-section.avatar"
                      id={member.user.id}
                      name={member.user.displayName}
                      url={member.user.avatarUrl}
                      size={36}
                      status={member.user.status}
                    />
                    <div data-gc="servidor.server-settings.members-section.div--5" className="min-w-0">
                      <p data-gc="servidor.server-settings.members-section.p" className="flex items-center gap-1.5 truncate text-sm font-medium">
                        {member.nickname ?? member.user.displayName}
                        {isOwner && <OwnerSeal data-gc="servidor.server-settings.members-section.owner-seal" size={13} />}
                        {fromTimeout && (
                          <span data-gc="servidor.server-settings.members-section.span" className="flex items-center gap-1 rounded bg-danger/15 px-1.5 py-0.5 text-10 text-danger">
                            <Clock data-gc="servidor.server-settings.members-section.clock" size={10} /> {t("servidor.membros.deCastigo")}
                          </span>
                        )}
                      </p>
                      <p data-gc="servidor.server-settings.members-section.p--2" className="truncate text-xs text-ink-faint">
                        @{member.user.username}
                      </p>
                    </div>
                  </div>
                </td>

                <td data-gc="servidor.server-settings.members-section.td--2" className="py-3 text-sm text-ink-muted">
                  {new Intl.DateTimeFormat("pt-BR").format(
                    new Date(member.joinedAt),
                  )}
                </td>

                <td data-gc="servidor.server-settings.members-section.td--3" className="py-3">
                  <div data-gc="servidor.server-settings.members-section.div--6" className="flex flex-wrap gap-1">
                    {roleList.map((role) => (
                      <span data-gc="servidor.server-settings.members-section.span--2"
                        key={role.id}
                        className="flex items-center gap-1 rounded bg-surface-0 px-1.5 py-0.5 text-11 text-ink-muted"
                      >
                        <span data-gc="servidor.server-settings.members-section.span--3"
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: role.color ?? "#99aab5" }}
                        />
                        {role.name}
                      </span>
                    ))}
                    {!roleList.length && (
                      <span data-gc="servidor.server-settings.members-section.span--4" className="text-xs text-ink-faint">—</span>
                    )}
                  </div>
                </td>

                <td data-gc="servidor.server-settings.members-section.td--4" className="py-3 text-right">
                  {!isOwner && !euSame && (
                    <DropdownMenu data-gc="servidor.server-settings.members-section.dropdown-menu">
                      <DropdownMenuTrigger data-gc="servidor.server-settings.members-section.dropdown-menu-trigger" asChild>
                        <button data-gc="servidor.server-settings.members-section.button--2"
                          aria-label={t("servidor.membros.acoesPara", { nome: member.user.displayName })}
                          className="rounded p-1.5 text-ink-muted opacity-0 transition group-hover:opacity-100 hover:bg-surface-0 hover:text-ink"
                        >
                          <MoreVertical data-gc="servidor.server-settings.members-section.more-vertical" size={16} />
                        </button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent data-gc="servidor.server-settings.members-section.dropdown-menu-content" align="end">
                        {canManageRoles &&
                          roles
                            .filter((r) => !r.isEveryone)
                            .map((role) => {
                              const has = member.roleIds.includes(role.id);

                              return (
                                <DropdownMenuItem data-gc="servidor.server-settings.members-section.dropdown-menu-item"
                                  key={role.id}
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    setRoles.mutate({
                                      guildId: guild.id,
                                      userId: member.user.id,
                                      roleIds: has
                                        ? member.roleIds.filter(
                                            (id) => id !== role.id,
                                          )
                                        : [...member.roleIds, role.id],
                                    });
                                  }}
                                >
                                  <span data-gc="servidor.server-settings.members-section.span--5" className="flex items-center gap-2">
                                    <span data-gc="servidor.server-settings.members-section.span--6"
                                      className="size-2.5 rounded-full"
                                      style={{
                                        backgroundColor:
                                          role.color ?? "#99aab5",
                                      }}
                                    />
                                    {role.name}
                                  </span>
                                  <Checkbox data-gc="servidor.server-settings.members-section.checkbox" readOnly checked={has} />
                                </DropdownMenuItem>
                              );
                            })}

                        {canTimeout && (
                          <>
                            <DropdownMenuSeparator data-gc="servidor.server-settings.members-section.dropdown-menu-separator" />
                            {fromTimeout ? (
                              <DropdownMenuItem data-gc="servidor.server-settings.members-section.dropdown-menu-item--2"
                                onSelect={() =>
                                  timeout.mutate({
                                    guildId: guild.id,
                                    userId: member.user.id,
                                    minutes: 0,
                                  })
                                }
                              >
                                {t("servidor.membros.tirarCastigo")} <Clock data-gc="servidor.server-settings.members-section.clock--2" size={14} />
                              </DropdownMenuItem>
                            ) : (
                              TIMEOUTS.map((option) => (
                                <DropdownMenuItem data-gc="servidor.server-settings.members-section.dropdown-menu-item--3"
                                  key={option.minutes}
                                  onSelect={() =>
                                    timeout.mutate({
                                      guildId: guild.id,
                                      userId: member.user.id,
                                      minutes: option.minutes,
                                    })
                                  }
                                >
                                  Castigo de {t(option.key)}
                                </DropdownMenuItem>
                              ))
                            )}
                          </>
                        )}

                        {(canKick || canBan) && <DropdownMenuSeparator data-gc="servidor.server-settings.members-section.dropdown-menu-separator--2" />}

                        {canKick && (
                          <DropdownMenuItem data-gc="servidor.server-settings.members-section.dropdown-menu-item--4"
                            danger
                            onSelect={() => void kick(member)}
                          >
                            {t("servidor.membros.expulsar")} <UserX data-gc="servidor.server-settings.members-section.user-x" size={14} />
                          </DropdownMenuItem>
                        )}

                        {canBan && (
                          <DropdownMenuItem data-gc="servidor.server-settings.members-section.dropdown-menu-item--5"
                            danger
                            onSelect={() => void banMember(member)}
                          >
                            {t("servidor.membros.banir")} <Ban data-gc="servidor.server-settings.members-section.ban" size={14} />
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {!list.length && (
        <p data-gc="servidor.server-settings.members-section.p--3" className={cn("py-10 text-center text-sm text-ink-faint")}>
          {t("servidor.membros.vazio")}
        </p>
      )}
    </div>
  );
};
