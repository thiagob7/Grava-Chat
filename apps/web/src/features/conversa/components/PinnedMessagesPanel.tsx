import React from "react";
import { PushPin, PushPinSlash } from "@phosphor-icons/react";

import { useFindPins, usePinMessage } from "~/@core/application/queries/message/use-pins";
import { Avatar } from "~/features/perfil/components/Avatar";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Tooltip } from "~/components/ui/tooltip";
import { formatTimestamp } from "~/lib/format";
import { useTranslation } from "~/traducao";
import { flxCls } from "~/lib/compat-fluxer";
import { cn } from "~/lib/utils";

interface PinnedMessagesPanelProps {
  channelId: string;
  canManage: boolean;
}

export const PinnedMessagesPanel: React.FC<PinnedMessagesPanelProps> = ({ channelId, canManage }) => {
  const { t } = useTranslation();
  const [aberto, setAberto] = React.useState(false);
  const { data: fixadas = [] } = useFindPins(channelId, aberto);
  const pinMessage = usePinMessage(channelId);

  return (
    <Popover data-gc="conversa.pinned-messages-panel.popover.set-aberto" open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger data-gc="conversa.pinned-messages-panel.popover-trigger" asChild>
        <button data-gc="conversa.pinned-messages-panel.button"
          aria-label={t("conversa.fixadas.titulo")}
          className="text-ink-muted transition hover:text-ink"
        >
          <Tooltip data-gc="conversa.pinned-messages-panel.tooltip" label={t("conversa.fixadas.titulo")}>
            <PushPin data-gc="conversa.pinned-messages-panel.push-pin" size={20} weight="fill" />
          </Tooltip>
        </button>
      </PopoverTrigger>

      <PopoverContent data-gc="conversa.pinned-messages-panel.popover-content"
        align="end"
        className={cn("w-96 p-0", flxCls("fixadas"))}
      >
        <header data-gc="conversa.pinned-messages-panel.header" className="flex items-center gap-2 border-b border-line px-4 py-3">
          <PushPin data-gc="conversa.pinned-messages-panel.push-pin--2" size={16} weight="fill" />
          <h3 data-gc="conversa.pinned-messages-panel.h3" className="font-semibold">{t("conversa.fixadas.titulo")}</h3>
        </header>

        <div data-gc="conversa.pinned-messages-panel.div" className="max-h-96 overflow-y-auto">
          {!fixadas.length && (
            <div data-gc="conversa.pinned-messages-panel.div--2" className="px-6 py-10 text-center">
              <PushPin data-gc="conversa.pinned-messages-panel.push-pin--3" size={32} weight="fill" className="mx-auto text-ink-faint" />
              <p data-gc="conversa.pinned-messages-panel.p" className="mt-3 text-sm text-ink-muted">{t("conversa.fixadas.vazio")}</p>
            </div>
          )}

          {fixadas.map((mensagem) => (
            <article data-gc="conversa.pinned-messages-panel.article" key={mensagem.id} className="group flex gap-3 border-b border-line px-4 py-3">
              <Avatar data-gc="conversa.pinned-messages-panel.avatar"
                id={mensagem.author.id}
                name={mensagem.author.displayName}
                url={mensagem.author.avatarUrl}
                size={32}
              />

              <div data-gc="conversa.pinned-messages-panel.div--3" className="min-w-0 flex-1">
                <p data-gc="conversa.pinned-messages-panel.p--2" className="flex items-baseline gap-2">
                  <span data-gc="conversa.pinned-messages-panel.span" className="truncate text-sm font-medium">{mensagem.author.displayName}</span>
                  <span data-gc="conversa.pinned-messages-panel.span--2" className="shrink-0 text-11 text-ink-faint">
                    {formatTimestamp(mensagem.createdAt)}
                  </span>
                </p>
                <p data-gc="conversa.pinned-messages-panel.p--3" className="mt-0.5 line-clamp-3 whitespace-pre-wrap break-words text-sm text-ink-muted">
                  {mensagem.content ||
                    t(
                      mensagem.attachments.length
                        ? "conversa.fixadas.anexo"
                        : "conversa.fixadas.enquete",
                    )}
                </p>
              </div>

              {canManage && (
                <button data-gc="conversa.pinned-messages-panel.button--2"
                  onClick={() => pinMessage.mutate({ messageId: mensagem.id, pin: false })}
                  title={t("conversa.fixadas.desafixar")}
                  className="self-start rounded p-1.5 text-ink-faint opacity-0 transition group-hover:opacity-100 hover:text-danger"
                >
                  <PushPinSlash data-gc="conversa.pinned-messages-panel.push-pin-slash" weight="fill" size={14} />
                </button>
              )}
            </article>
          ))}
        </div>

        <p data-gc="conversa.pinned-messages-panel.p--4" className="px-4 py-3 text-xs text-ink-faint">
          <span data-gc="conversa.pinned-messages-panel.span--3" className="font-semibold text-online">{t("conversa.fixadas.dicaRotulo")}</span>{" "}
          {t("conversa.fixadas.dica")}
        </p>
      </PopoverContent>
    </Popover>
  );
};
