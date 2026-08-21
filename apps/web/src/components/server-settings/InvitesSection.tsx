import React from "react";
import { Trash2 } from "lucide-react";

import { useFindGuildInvites } from "~/@core/application/queries/guild/use-find-guild-invites";
import { useDeleteInvite } from "~/@core/application/queries/guild/use-delete-invite";
import { Avatar } from "~/components/Avatar";
import { Tooltip } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

export const InvitesSection: React.FC<{ guildId: string }> = ({ guildId }) => {
  const { data: convites = [], isLoading } = useFindGuildInvites(guildId, true);
  const deleteInvite = useDeleteInvite();

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold">Convites</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Todos os links de convite ativos deste servidor.
      </p>

      <div className="my-6 h-px bg-line" />

      {isLoading ? (
        <p className="text-sm text-ink-faint">Carregando…</p>
      ) : !convites.length ? (
        <p className="py-8 text-center text-sm text-ink-faint">
          Nenhum convite criado ainda.
        </p>
      ) : (
        <div className="space-y-px">
          {convites.map((convite) => (
            <div
              key={convite.id}
              className={cn(
                "flex items-center gap-3 border-t border-line px-2 py-3",
                convite.expired && "opacity-50",
              )}
            >
              <Avatar
                id={convite.inviter.id}
                name={convite.inviter.displayName}
                url={convite.inviter.avatarUrl}
                size={32}
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{convite.inviter.displayName}</p>
                <code className="text-xs text-ink-faint">{convite.code}</code>
              </div>

              <div className="shrink-0 text-right text-xs text-ink-faint">
                <p>
                  {convite.uses} uso{convite.uses === 1 ? "" : "s"}
                  {convite.maxUses !== null && ` de ${convite.maxUses}`}
                </p>
                <p>
                  {convite.expired
                    ? "Expirado"
                    : convite.expiresAt
                      ? `Expira ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(convite.expiresAt))}`
                      : "Nunca expira"}
                </p>
              </div>

              <Tooltip label="Revogar convite">
                <button
                  onClick={() => deleteInvite.mutate({ guildId, inviteId: convite.id })}
                  className="rounded p-2 text-ink-muted transition hover:bg-surface-0 hover:text-danger"
                >
                  <Trash2 size={18} />
                </button>
              </Tooltip>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
