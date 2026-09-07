import React from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import { useMe } from "~/@core/application/queries/auth/use-me";
import { useAcceptInvite } from "~/@core/application/queries/invite/use-accept-invite";
import { useFindInvite } from "~/@core/application/queries/invite/use-find-invite";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";
import { Avatar } from "~/features/perfil/components/Avatar";
import { SeloDaComunidade } from "~/features/servidor/components/SeloDaComunidade";

const numero = new Intl.NumberFormat("pt-BR");

/*
  O convite, antes de entrar.

  Clicar num cartão de convite não põe ninguém dentro de um servidor: abre
  isto, que mostra quem convida, quantos estão lá, e pergunta. É o mesmo
  passo que o link `/invite/:code` faz numa página inteira, só que no lugar.
*/
export const ConviteModal: React.FC<{
  codigo: string | null;
  onFechar: () => void;
}> = ({ codigo, onFechar }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: eu } = useMe(true);
  const { data: convite, isLoading } = useFindInvite(codigo ?? "");
  const entrar = useAcceptInvite();

  const aceitar = () => {
    if (!codigo || !convite) return;

    if (convite.alreadyMember) {
      onFechar();
      navigate(`/channels/${convite.guild.id}`);
      return;
    }

    void entrar
      .mutateAsync(codigo)
      .then((resultado) => {
        onFechar();
        navigate(`/channels/${resultado.guildId}`);
      })
      .catch(() => {});
  };

  return (
    <Dialog data-gc="servidor.convite-modal.dialog" open={codigo !== null} onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent data-gc="servidor.convite-modal.dialog-content" className="max-w-md">
        <div data-gc="servidor.convite-modal.div" className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
          {isLoading || !convite ? (
            <div data-gc="servidor.convite-modal.div--2" className="h-48 w-full animate-pulse rounded-lg bg-surface-3" />
          ) : (
            <>
              <Avatar data-gc="servidor.convite-modal.avatar" id={convite.guild.id} name={convite.guild.name} url={convite.guild.iconUrl} size={72} />

              <p data-gc="servidor.convite-modal.p" className="mt-4 text-sm text-ink-muted">{t("servidor.convite.chamado")}</p>

              <DialogTitle data-gc="servidor.convite-modal.dialog-title" className="mt-1 flex items-center justify-center gap-2 text-2xl font-bold leading-tight">
                <span data-gc="servidor.convite-modal.span">{convite.guild.name}</span>
                <SeloDaComunidade data-gc="servidor.convite-modal.selo-da-comunidade" verificada={convite.guild.verificada} detectavel={convite.guild.detectavel} tamanho={20} />
              </DialogTitle>

              <p data-gc="servidor.convite-modal.p--2" className="mt-2 flex items-center gap-4 text-sm text-ink-muted">
                <span data-gc="servidor.convite-modal.span--2" className="flex items-center gap-1.5">
                  <span data-gc="servidor.convite-modal.span--3" className="size-2 rounded-full bg-online" />
                  {numero.format(convite.guild.onlineCount)} online
                </span>
                <span data-gc="servidor.convite-modal.span--4" className="flex items-center gap-1.5">
                  <span data-gc="servidor.convite-modal.span--5" className="size-2 rounded-full bg-ink-faint" />
                  {numero.format(convite.guild.memberCount)} {convite.guild.memberCount === 1 ? "membro" : "membros"}
                </span>
              </p>

              {convite.guild.description && (
                <p data-gc="servidor.convite-modal.p--3" className="mt-4 max-w-sm text-sm text-ink-muted">{convite.guild.description}</p>
              )}

              <Button data-gc="servidor.convite-modal.button.aceitar" className="mt-8 w-full" disabled={entrar.isPending} onClick={aceitar}>
                {convite.alreadyMember
                  ? t("servidor.convite.abrir")
                  : t("servidor.convite.aceitarComo", { nome: eu?.displayName ?? "" })}
              </Button>

              <button data-gc="servidor.convite-modal.button.on-fechar"
                type="button"
                onClick={onFechar}
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
