import React from "react";
import { Copy, Eye, MoreHorizontal, X } from "lucide-react";

import { Button, IconButton } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { copyText } from "~/lib/copiar";
import { Avatar } from "~/features/perfil/components/Avatar";
import { UserName } from "~/features/perfil/components/UserName";
import { formatTime, formatTimestamp } from "~/lib/format";
import { useTranslation } from "~/traducao";

const HOUSE_NAME = "Gravaê";

/*
  O Gravaê explica a recusa dentro da conversa, logo abaixo da mensagem que não
  saiu. Não é mensagem de verdade: não vai ao servidor, a outra pessoa nunca vê,
  e some ao dispensar ou ao recarregar — igual à própria mensagem recusada, que
  também só existe na tela de quem escreveu.
*/
export const UndeliveredNotice: React.FC<{ createdAt: string; onDismiss: () => void }> = ({
  createdAt,
  onDismiss,
}) => {
  const { t } = useTranslation();

  return (
    <div data-gc="conversa.aviso-de-nao-entregue.div" className="group/aviso relative mt-4 flex gap-x-2 bg-brand/10 px-2 py-1 shadow-[inset_2px_0_0_var(--color-brand)] @sm:gap-x-[var(--message-gutter)] @sm:px-4">
      <div data-gc="conversa.aviso-de-nao-entregue.div--2" className="w-10 shrink-0">
        <Avatar data-gc="conversa.aviso-de-nao-entregue.avatar" id="gravae-sistema" name={HOUSE_NAME} url="/brand/icone-512.png" />
      </div>

      <div data-gc="conversa.aviso-de-nao-entregue.div--3" className="min-w-0 flex-1">
        <div data-gc="conversa.aviso-de-nao-entregue.div--4" className="flex items-baseline gap-x-2">
          <UserName data-gc="conversa.aviso-de-nao-entregue.user-name" name={HOUSE_NAME} isSystem className="font-medium text-ink" />
          <span data-gc="conversa.aviso-de-nao-entregue.span" className="shrink-0 text-xs text-ink-muted" title={formatTimestamp(createdAt)}>
            {formatTime(createdAt)}
          </span>
        </div>

        <p data-gc="conversa.aviso-de-nao-entregue.p" className="text-ink">{t("conversa.sistema.naoEntregue")}</p>

        <p data-gc="conversa.aviso-de-nao-entregue.p--2" className="mt-1 flex flex-wrap items-center gap-1 text-xs text-ink-faint">
          <Eye data-gc="conversa.aviso-de-nao-entregue.eye" size={13} />
          {t("conversa.sistema.soVoce")}
          <Button data-gc="conversa.aviso-de-nao-entregue.button.on-dismiss" type="button" variant="link" size="xs" onClick={onDismiss} className="p-0 font-normal text-link">
            {t("conversa.sistema.dispensar")}
          </Button>
        </p>
      </div>

      <DropdownMenu data-gc="conversa.aviso-de-nao-entregue.dropdown-menu">
        <DropdownMenuTrigger data-gc="conversa.aviso-de-nao-entregue.dropdown-menu-trigger" asChild>
          <IconButton data-gc="conversa.aviso-de-nao-entregue.icon-button"
            variant="surface"
            size="xs"
            label={t("conversa.acoes.mais")}
            className="absolute right-3 top-1 opacity-0 shadow-sm transition group-hover/aviso:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
          >
            <MoreHorizontal data-gc="conversa.aviso-de-nao-entregue.more-horizontal" />
          </IconButton>
        </DropdownMenuTrigger>

        <DropdownMenuContent data-gc="conversa.aviso-de-nao-entregue.dropdown-menu-content" align="end" className="w-48">
          <DropdownMenuItem data-gc="conversa.aviso-de-nao-entregue.dropdown-menu-item" onSelect={() => void copyText(t("conversa.sistema.naoEntregue"))}>
            {t("conversa.codigo.copiar")} <Copy data-gc="conversa.aviso-de-nao-entregue.copy" size={15} />
          </DropdownMenuItem>
          <DropdownMenuItem data-gc="conversa.aviso-de-nao-entregue.dropdown-menu-item.on-dismiss" onSelect={onDismiss}>
            {t("conversa.sistema.dispensar")} <X data-gc="conversa.aviso-de-nao-entregue.x" size={15} />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
