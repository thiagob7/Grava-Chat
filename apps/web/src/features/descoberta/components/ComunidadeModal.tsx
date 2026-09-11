import React from "react";
import { Loader2 } from "lucide-react";
import type { CommunityDiscovery } from "@gravae/shared";

import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";
import { Avatar } from "~/features/perfil/components/Avatar";
import { CommunitySeal } from "~/features/servidor/components/SeloDaComunidade";
import { useTranslation } from "~/traducao";

const number = new Intl.NumberFormat("pt-BR");

export const CommunityModal: React.FC<{
  community: CommunityDiscovery | null;
  joining: boolean;
  onClose: () => void;
  onJoin: (community: CommunityDiscovery) => void;
  onOpen: (community: CommunityDiscovery) => void;
}> = ({ community, joining, onClose, onJoin, onOpen }) => {
  const { t } = useTranslation();

  return (
    <Dialog data-gc="descoberta.comunidade-modal.dialog" open={community !== null} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent data-gc="descoberta.comunidade-modal.dialog-content" className="max-w-md">
        {community && (
          <div data-gc="descoberta.comunidade-modal.div" className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
            <Avatar data-gc="descoberta.comunidade-modal.avatar" id={community.id} name={community.name} url={community.iconUrl} size={72} />

            <p data-gc="descoberta.comunidade-modal.p" className="mt-4 text-sm text-ink-muted">{t("servidor.descoberta.comunidadePublica")}</p>

            <DialogTitle data-gc="descoberta.comunidade-modal.dialog-title" className="mt-1 flex items-center justify-center gap-2 text-2xl font-bold leading-tight">
              <span data-gc="descoberta.comunidade-modal.span">{community.name}</span>
              <CommunitySeal data-gc="descoberta.comunidade-modal.community-seal" verified={community.verified} detectable size={20} />
            </DialogTitle>

            <p data-gc="descoberta.comunidade-modal.p--2" className="mt-2 flex items-center gap-4 text-sm text-ink-muted">
              <span data-gc="descoberta.comunidade-modal.span--2" className="flex items-center gap-1.5">
                <span data-gc="descoberta.comunidade-modal.span--3" className="size-2 rounded-full bg-online" />
                {t("servidor.descoberta.online", { quantos: number.format(community.online) })}
              </span>
              <span data-gc="descoberta.comunidade-modal.span--4" className="flex items-center gap-1.5">
                <span data-gc="descoberta.comunidade-modal.span--5" className="size-2 rounded-full bg-ink-faint" />
                {t("servidor.descoberta.membros", { quantos: number.format(community.members) })}
              </span>
            </p>

            {community.description && (
              <p data-gc="descoberta.comunidade-modal.p--3" className="mt-4 max-w-sm text-sm text-ink-muted">{community.description}</p>
            )}

            {community.alreadyAmMember ? (
              <Button data-gc="descoberta.comunidade-modal.button" variant="surface" className="mt-8 w-full" onClick={() => onOpen(community)}>
                {t("servidor.descoberta.abrirComunidade")}
              </Button>
            ) : (
              <Button data-gc="descoberta.comunidade-modal.button--2" className="mt-8 w-full" disabled={joining} onClick={() => onJoin(community)}>
                {joining ? <Loader2 data-gc="descoberta.comunidade-modal.loader2" size={14} className="animate-spin" /> : null}
                {joining ? "Entrando…" : "Entrar na comunidade"}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
