import React from "react";
import { Trash2 } from "lucide-react";

import { useFindGuildInvites } from "~/@core/application/queries/guild/use-find-guild-invites";
import { useDeleteInvite } from "~/@core/application/queries/guild/use-delete-invite";
import { Avatar } from "~/components/Avatar";
import { Tooltip } from "~/components/ui/tooltip";
import { useConfirmar } from "~/components/ui/confirm";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

export const InvitesSection: React.FC<{ guildId: string }> = ({ guildId }) => {
  const { t } = useTranslation();
  const { data: convites = [], isLoading } = useFindGuildInvites(guildId, true);
  const confirmar = useConfirmar();
  const deleteInvite = useDeleteInvite();

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold">{t("servidor.convites.titulo")}</h2>
      <p className="mt-1 text-sm text-ink-muted">
        {t("servidor.convites.descricao")}
      </p>

      <div className="my-6 h-px bg-line" />

      {isLoading ? (
        <p className="text-sm text-ink-faint">{t("comum.carregando")}</p>
      ) : !convites.length ? (
        <p className="py-8 text-center text-sm text-ink-faint">
          {t("servidor.convites.vazio")}
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
                <p className="truncate text-sm font-medium">
                  {convite.inviter.displayName}
                </p>
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

              <Tooltip label={t("servidor.convites.revogar")}>
                <button
                  onClick={() =>
                    void confirmar({
                      titulo: t("servidor.convites.revogarTitulo"),
                      descricao: t("servidor.convites.revogarDescricao", {
                        codigo: convite.code,
                      }),
                      acao: t("servidor.convites.revogarAcao"),
                    }).then(
                      ({ confirmado }) =>
                        confirmado &&
                        deleteInvite.mutate({ guildId, inviteId: convite.id }),
                    )
                  }
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
