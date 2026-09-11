import React from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import { useMe } from "~/@core/application/queries/auth/use-me";
import { useAcceptInvite } from "~/@core/application/queries/invite/use-accept-invite";
import { useFindInvite } from "~/@core/application/queries/invite/use-find-invite";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";
import { Avatar } from "~/features/perfil/components/Avatar";
import { CommunitySeal } from "~/features/servidor/components/SeloDaComunidade";

const number = new Intl.NumberFormat("pt-BR");

export const InviteModal: React.FC<{
  code: string | null;
  onClose: () => void;
}> = ({ code, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: eu } = useMe(true);
  const { data: invite, isLoading } = useFindInvite(code ?? "");
  const join = useAcceptInvite();

  const accept = () => {
    if (!code || !invite) return;

    if (invite.alreadyMember) {
      onClose();
      navigate(`/channels/${invite.guild.id}`);
      return;
    }

    void join
      .mutateAsync(code)
      .then((result) => {
        onClose();
        navigate(`/channels/${result.guildId}`);
      })
      .catch(() => {});
  };

  return (
    <Dialog data-gc="servidor.convite-modal.dialog" open={code !== null} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent data-gc="servidor.convite-modal.dialog-content" className="max-w-md">
        <div data-gc="servidor.convite-modal.div" className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
          {isLoading || !invite ? (
            <div data-gc="servidor.convite-modal.div--2" className="h-48 w-full animate-pulse rounded-lg bg-surface-3" />
          ) : (
            <>
              <Avatar data-gc="servidor.convite-modal.avatar" id={invite.guild.id} name={invite.guild.name} url={invite.guild.iconUrl} size={72} />

              <p data-gc="servidor.convite-modal.p" className="mt-4 text-sm text-ink-muted">{t("servidor.convite.chamado")}</p>

              <DialogTitle data-gc="servidor.convite-modal.dialog-title" className="mt-1 flex items-center justify-center gap-2 text-2xl font-bold leading-tight">
                <span data-gc="servidor.convite-modal.span">{invite.guild.name}</span>
                <CommunitySeal data-gc="servidor.convite-modal.community-seal" verified={invite.guild.verified} detectable={invite.guild.detectable} size={20} />
              </DialogTitle>

              <p data-gc="servidor.convite-modal.p--2" className="mt-2 flex items-center gap-4 text-sm text-ink-muted">
                <span data-gc="servidor.convite-modal.span--2" className="flex items-center gap-1.5">
                  <span data-gc="servidor.convite-modal.span--3" className="size-2 rounded-full bg-online" />
                  {number.format(invite.guild.onlineCount)} online
                </span>
                <span data-gc="servidor.convite-modal.span--4" className="flex items-center gap-1.5">
                  <span data-gc="servidor.convite-modal.span--5" className="size-2 rounded-full bg-ink-faint" />
                  {number.format(invite.guild.memberCount)} {invite.guild.memberCount === 1 ? "membro" : "membros"}
                </span>
              </p>

              {invite.guild.description && (
                <p data-gc="servidor.convite-modal.p--3" className="mt-4 max-w-sm text-sm text-ink-muted">{invite.guild.description}</p>
              )}

              <Button data-gc="servidor.convite-modal.button.accept" className="mt-8 w-full" disabled={join.isPending} onClick={accept}>
                {invite.alreadyMember
                  ? t("servidor.convite.abrir")
                  : t("servidor.convite.aceitarComo", { nome: eu?.displayName ?? "" })}
              </Button>

              <button data-gc="servidor.convite-modal.button.on-close"
                type="button"
                onClick={onClose}
                className="mt-3 text-sm text-ink-muted transition hover:text-ink hover:underline"
              >
                {t("servidor.convite.recusar")}
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
