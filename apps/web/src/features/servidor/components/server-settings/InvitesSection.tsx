import React from "react";
import { Trash2 } from "lucide-react";

import { useFindGuildInvites } from "~/@core/application/queries/guild/use-find-guild-invites";
import { useDeleteInvite } from "~/@core/application/queries/guild/use-delete-invite";
import { Avatar } from "~/features/perfil/components/Avatar";
import { Tooltip } from "~/components/ui/tooltip";
import { useConfirm } from "~/components/ui/confirm";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

export const InvitesSection: React.FC<{ guildId: string }> = ({ guildId }) => {
  const { t } = useTranslation();
  const { data: invites = [], isLoading } = useFindGuildInvites(guildId, true);
  const confirm = useConfirm();
  const deleteInvite = useDeleteInvite();

  return (
    <div data-gc="servidor.server-settings.invites-section.div" className="max-w-3xl">
      <h2 data-gc="servidor.server-settings.invites-section.h2" className="text-xl font-semibold">{t("servidor.convites.titulo")}</h2>
      <p data-gc="servidor.server-settings.invites-section.p" className="mt-1 text-sm text-ink-muted">
        {t("servidor.convites.descricao")}
      </p>

      <div data-gc="servidor.server-settings.invites-section.div--2" className="my-6 h-px bg-line" />

      {isLoading ? (
        <p data-gc="servidor.server-settings.invites-section.p--2" className="text-sm text-ink-faint">{t("comum.carregando")}</p>
      ) : !invites.length ? (
        <p data-gc="servidor.server-settings.invites-section.p--3" className="py-8 text-center text-sm text-ink-faint">
          {t("servidor.convites.vazio")}
        </p>
      ) : (
        <div data-gc="servidor.server-settings.invites-section.div--3" className="space-y-px">
          {invites.map((invite) => (
            <div data-gc="servidor.server-settings.invites-section.div--4"
              key={invite.id}
              className={cn(
                "flex items-center gap-3 border-t border-line px-2 py-3",
                invite.expired && "opacity-50",
              )}
            >
              <Avatar data-gc="servidor.server-settings.invites-section.avatar"
                id={invite.inviter.id}
                name={invite.inviter.displayName}
                url={invite.inviter.avatarUrl}
                size={32}
              />

              <div data-gc="servidor.server-settings.invites-section.div--5" className="min-w-0 flex-1">
                <p data-gc="servidor.server-settings.invites-section.p--4" className="truncate text-sm font-medium">
                  {invite.inviter.displayName}
                </p>
                <code data-gc="servidor.server-settings.invites-section.code" className="text-xs text-ink-faint">{invite.code}</code>
              </div>

              <div data-gc="servidor.server-settings.invites-section.div--6" className="shrink-0 text-right text-xs text-ink-faint">
                <p data-gc="servidor.server-settings.invites-section.p--5">
                  {invite.uses} uso{invite.uses === 1 ? "" : "s"}
                  {invite.maxUses !== null && ` de ${invite.maxUses}`}
                </p>
                <p data-gc="servidor.server-settings.invites-section.p--6">
                  {invite.expired
                    ? "Expirado"
                    : invite.expiresAt
                      ? `Expira ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(invite.expiresAt))}`
                      : "Nunca expira"}
                </p>
              </div>

              <Tooltip data-gc="servidor.server-settings.invites-section.tooltip" label={t("servidor.convites.revogar")}>
                <button data-gc="servidor.server-settings.invites-section.button"
                  onClick={() =>
                    void confirm({
                      title: t("servidor.convites.revogarTitulo"),
                      description: t("servidor.convites.revogarDescricao", {
                        codigo: invite.code,
                      }),
                      action: t("servidor.convites.revogarAcao"),
                    }).then(
                      ({ confirmed }) =>
                        confirmed &&
                        deleteInvite.mutate({ guildId, inviteId: invite.id }),
                    )
                  }
                  className="rounded p-2 text-ink-muted transition hover:bg-surface-0 hover:text-danger"
                >
                  <Trash2 data-gc="servidor.server-settings.invites-section.trash2" size={18} />
                </button>
              </Tooltip>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
