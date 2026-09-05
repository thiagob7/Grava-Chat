import React from "react";
import { Trash2 } from "lucide-react";

import { useFindGuildInvites } from "~/@core/application/queries/guild/use-find-guild-invites";
import { useDeleteInvite } from "~/@core/application/queries/guild/use-delete-invite";
import { Avatar } from "~/features/perfil/components/Avatar";
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
    <div data-gc="servidor.server-settings.invites-section.div" className="max-w-3xl">
      <h2 data-gc="servidor.server-settings.invites-section.h2" className="text-xl font-semibold">{t("servidor.convites.titulo")}</h2>
      <p data-gc="servidor.server-settings.invites-section.p" className="mt-1 text-sm text-ink-muted">
        {t("servidor.convites.descricao")}
      </p>

      <div data-gc="servidor.server-settings.invites-section.div--2" className="my-6 h-px bg-line" />

      {isLoading ? (
        <p data-gc="servidor.server-settings.invites-section.p--2" className="text-sm text-ink-faint">{t("comum.carregando")}</p>
      ) : !convites.length ? (
        <p data-gc="servidor.server-settings.invites-section.p--3" className="py-8 text-center text-sm text-ink-faint">
          {t("servidor.convites.vazio")}
        </p>
      ) : (
        <div data-gc="servidor.server-settings.invites-section.div--3" className="space-y-px">
          {convites.map((convite) => (
            <div data-gc="servidor.server-settings.invites-section.div--4"
              key={convite.id}
              className={cn(
                "flex items-center gap-3 border-t border-line px-2 py-3",
                convite.expired && "opacity-50",
              )}
            >
              <Avatar data-gc="servidor.server-settings.invites-section.avatar"
                id={convite.inviter.id}
                name={convite.inviter.displayName}
                url={convite.inviter.avatarUrl}
                size={32}
              />

              <div data-gc="servidor.server-settings.invites-section.div--5" className="min-w-0 flex-1">
                <p data-gc="servidor.server-settings.invites-section.p--4" className="truncate text-sm font-medium">
                  {convite.inviter.displayName}
                </p>
                <code data-gc="servidor.server-settings.invites-section.code" className="text-xs text-ink-faint">{convite.code}</code>
              </div>

              <div data-gc="servidor.server-settings.invites-section.div--6" className="shrink-0 text-right text-xs text-ink-faint">
                <p data-gc="servidor.server-settings.invites-section.p--5">
                  {convite.uses} uso{convite.uses === 1 ? "" : "s"}
                  {convite.maxUses !== null && ` de ${convite.maxUses}`}
                </p>
                <p data-gc="servidor.server-settings.invites-section.p--6">
                  {convite.expired
                    ? "Expirado"
                    : convite.expiresAt
                      ? `Expira ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(convite.expiresAt))}`
                      : "Nunca expira"}
                </p>
              </div>

              <Tooltip data-gc="servidor.server-settings.invites-section.tooltip" label={t("servidor.convites.revogar")}>
                <button data-gc="servidor.server-settings.invites-section.button"
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
