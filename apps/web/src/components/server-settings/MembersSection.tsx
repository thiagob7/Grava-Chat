import React, { useMemo, useState } from "react";
import { ArrowUpDown, Ban, Clock, Crown, MoreVertical, Search, UserX } from "lucide-react";
import type { GuildMember, Role } from "@gravae/shared";

import { useRemoveMember } from "~/@core/application/queries/guild/use-remove-member";
import {
  useBanMember,
  useTimeoutMember,
} from "~/@core/application/queries/moderation/use-moderation";
import { useSetMemberRoles } from "~/@core/application/queries/role/use-set-member-roles";
import type { GuildModel } from "~/@core/domain/models/guild-model";
import { Avatar } from "~/components/Avatar";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { useConfirmar } from "~/components/ui/confirm";
import { cn } from "~/lib/utils";

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

type Ordem = "recentes" | "antigos" | "nome";

const CASTIGOS = [
  { minutos: 5, label: "5 minutos" },
  { minutos: 60, label: "1 hora" },
  { minutos: 60 * 24, label: "1 dia" },
  { minutos: 60 * 24 * 7, label: "1 semana" },
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
  const confirmar = useConfirmar();
  const removeMember = useRemoveMember();
  const banir = useBanMember(guild.id);
  const castigar = useTimeoutMember(guild.id);
  const setRoles = useSetMemberRoles(guild.id);

  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("recentes");

  const nomeDe = (member: GuildMember) => member.nickname ?? member.user.displayName;

  const expulsar = async (member: GuildMember) => {
    const { confirmado } = await confirmar({
      titulo: `Expulsar ${nomeDe(member)}?`,
      descricao: (
        <>
          <strong>{nomeDe(member)}</strong> sai de {guild.name} na hora. Pode entrar de novo com um
          convite — expulsar não impede a volta.
        </>
      ),
      acao: "Expulsar",
    });

    if (confirmado) removeMember.mutate({ guildId: guild.id, userId: member.user.id });
  };

  const banirMembro = async (member: GuildMember) => {
    const { confirmado, texto } = await confirmar({
      titulo: `Banir ${nomeDe(member)}?`,
      descricao: (
        <>
          <strong>{nomeDe(member)}</strong> sai de {guild.name} e <strong>não consegue voltar</strong>,
          nem com convite, até ser desbanido.
        </>
      ),
      acao: "Banir",
      campo: { rotulo: "Motivo (opcional)", placeholder: "Fica registrado na auditoria" },
    });

    if (confirmado) {
      banir.mutate({ guildId: guild.id, userId: member.user.id, reason: texto || null });
    }
  };

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    const filtrados = termo
      ? members.filter(
          (m) =>
            m.user.displayName.toLowerCase().includes(termo) ||
            m.user.username.toLowerCase().includes(termo),
        )
      : [...members];

    return filtrados.sort((a, b) => {
      if (ordem === "nome") return a.user.displayName.localeCompare(b.user.displayName);

      const tempoA = new Date(a.joinedAt).getTime();
      const tempoB = new Date(b.joinedAt).getTime();

      return ordem === "recentes" ? tempoB - tempoA : tempoA - tempoB;
    });
  }, [members, busca, ordem]);

  return (
    <div className="max-w-4xl pb-10">
      <h2 className="text-xl font-semibold">Membros do servidor — {members.length}</h2>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded bg-surface-0 px-3">
          <Search size={16} className="text-ink-faint" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar pelo nome ou usuário"
            className="bg-transparent px-0"
          />
        </div>

        <Button
          variant="surface"
          size="sm"
          onClick={() =>
            setOrdem((atual) =>
              atual === "recentes" ? "antigos" : atual === "antigos" ? "nome" : "recentes",
            )
          }
        >
          <ArrowUpDown size={14} />
          {ordem === "recentes" ? "Mais recentes" : ordem === "antigos" ? "Mais antigos" : "Nome"}
        </Button>
      </div>

      <table className="mt-4 w-full">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-faint">
            <th className="pb-2 font-semibold">Nome</th>
            <th className="pb-2 font-semibold">Membro desde</th>
            <th className="pb-2 font-semibold">Cargos</th>
            <th />
          </tr>
        </thead>

        <tbody>
          {lista.map((member) => {
            const ehDono = member.user.id === guild.ownerId;
            const euMesmo = member.user.id === currentUserId;
            const cargos = roles.filter((r) => !r.isEveryone && member.roleIds.includes(r.id));
            const deCastigo =
              member.timeoutUntil && new Date(member.timeoutUntil) > new Date()
                ? new Date(member.timeoutUntil)
                : null;

            return (
              <tr key={member.id} className="group border-b border-line align-middle">
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      id={member.user.id}
                      name={member.user.displayName}
                      url={member.user.avatarUrl}
                      size={36}
                      status={member.user.status}
                    />
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                        {member.nickname ?? member.user.displayName}
                        {ehDono && <Crown size={13} className="text-idle" />}
                        {deCastigo && (
                          <span className="flex items-center gap-1 rounded bg-danger/15 px-1.5 py-0.5 text-[10px] text-danger">
                            <Clock size={10} /> de castigo
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-ink-faint">@{member.user.username}</p>
                    </div>
                  </div>
                </td>

                <td className="py-3 text-sm text-ink-muted">
                  {new Intl.DateTimeFormat("pt-BR").format(new Date(member.joinedAt))}
                </td>

                <td className="py-3">
                  <div className="flex flex-wrap gap-1">
                    {cargos.map((role) => (
                      <span
                        key={role.id}
                        className="flex items-center gap-1 rounded bg-surface-0 px-1.5 py-0.5 text-[11px] text-ink-muted"
                      >
                        <span
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: role.color ?? "#99aab5" }}
                        />
                        {role.name}
                      </span>
                    ))}
                    {!cargos.length && <span className="text-xs text-ink-faint">—</span>}
                  </div>
                </td>

                <td className="py-3 text-right">
                  {!ehDono && !euMesmo && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          aria-label={`Ações para ${member.user.displayName}`}
                          className="rounded p-1.5 text-ink-muted opacity-0 transition group-hover:opacity-100 hover:bg-surface-0 hover:text-ink"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        {canManageRoles &&
                          roles
                            .filter((r) => !r.isEveryone)
                            .map((role) => {
                              const tem = member.roleIds.includes(role.id);

                              return (
                                <DropdownMenuItem
                                  key={role.id}
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    setRoles.mutate({
                                      guildId: guild.id,
                                      userId: member.user.id,
                                      roleIds: tem
                                        ? member.roleIds.filter((id) => id !== role.id)
                                        : [...member.roleIds, role.id],
                                    });
                                  }}
                                >
                                  <span className="flex items-center gap-2">
                                    <span
                                      className="size-2.5 rounded-full"
                                      style={{ backgroundColor: role.color ?? "#99aab5" }}
                                    />
                                    {role.name}
                                  </span>
                                  <input
                                    type="checkbox"
                                    readOnly
                                    checked={tem}
                                    className="size-4 accent-brand"
                                  />
                                </DropdownMenuItem>
                              );
                            })}

                        {canTimeout && (
                          <>
                            <DropdownMenuSeparator />
                            {deCastigo ? (
                              <DropdownMenuItem
                                onSelect={() =>
                                  castigar.mutate({
                                    guildId: guild.id,
                                    userId: member.user.id,
                                    minutos: 0,
                                  })
                                }
                              >
                                Tirar do castigo <Clock size={14} />
                              </DropdownMenuItem>
                            ) : (
                              CASTIGOS.map((opcao) => (
                                <DropdownMenuItem
                                  key={opcao.minutos}
                                  onSelect={() =>
                                    castigar.mutate({
                                      guildId: guild.id,
                                      userId: member.user.id,
                                      minutos: opcao.minutos,
                                    })
                                  }
                                >
                                  Castigo de {opcao.label}
                                </DropdownMenuItem>
                              ))
                            )}
                          </>
                        )}

                        {(canKick || canBan) && <DropdownMenuSeparator />}

                        {canKick && (
                          <DropdownMenuItem
                            danger
                            onSelect={() => void expulsar(member)}
                          >
                            Expulsar <UserX size={14} />
                          </DropdownMenuItem>
                        )}

                        {canBan && (
                          <DropdownMenuItem
                            danger
                            onSelect={() => void banirMembro(member)}
                          >
                            Banir <Ban size={14} />
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

      {!lista.length && (
        <p className={cn("py-10 text-center text-sm text-ink-faint")}>Ninguém encontrado.</p>
      )}
    </div>
  );
};
