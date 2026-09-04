import React from "react";
import { PushPin, PushPinSlash } from "@phosphor-icons/react";

import { useFindPins, usePinMessage } from "~/@core/application/queries/message/use-pins";
import { Avatar } from "~/features/perfil/components/Avatar";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Tooltip } from "~/components/ui/tooltip";
import { formatTimestamp } from "~/lib/format";
import { useTranslation } from "~/traducao";

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
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <button
          aria-label={t("conversa.fixadas.titulo")}
          className="text-ink-muted transition hover:text-ink"
        >
          <Tooltip label={t("conversa.fixadas.titulo")}>
            <PushPin size={20} weight="fill" />
          </Tooltip>
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-96 p-0">
        <header className="flex items-center gap-2 border-b border-line px-4 py-3">
          <PushPin size={16} weight="fill" />
          <h3 className="font-semibold">{t("conversa.fixadas.titulo")}</h3>
        </header>

        <div className="max-h-96 overflow-y-auto">
          {!fixadas.length && (
            <div className="px-6 py-10 text-center">
              <PushPin size={32} weight="fill" className="mx-auto text-ink-faint" />
              <p className="mt-3 text-sm text-ink-muted">{t("conversa.fixadas.vazio")}</p>
            </div>
          )}

          {fixadas.map((mensagem) => (
            <article key={mensagem.id} className="group flex gap-3 border-b border-line px-4 py-3">
              <Avatar
                id={mensagem.author.id}
                name={mensagem.author.displayName}
                url={mensagem.author.avatarUrl}
                size={32}
              />

              <div className="min-w-0 flex-1">
                <p className="flex items-baseline gap-2">
                  <span className="truncate text-sm font-medium">{mensagem.author.displayName}</span>
                  <span className="shrink-0 text-11 text-ink-faint">
                    {formatTimestamp(mensagem.createdAt)}
                  </span>
                </p>
                <p className="mt-0.5 line-clamp-3 whitespace-pre-wrap break-words text-sm text-ink-muted">
                  {mensagem.content ||
                    t(
                      mensagem.attachments.length
                        ? "conversa.fixadas.anexo"
                        : "conversa.fixadas.enquete",
                    )}
                </p>
              </div>

              {canManage && (
                <button
                  onClick={() => pinMessage.mutate({ messageId: mensagem.id, pin: false })}
                  title={t("conversa.fixadas.desafixar")}
                  className="self-start rounded p-1.5 text-ink-faint opacity-0 transition group-hover:opacity-100 hover:text-danger"
                >
                  <PushPinSlash weight="fill" size={14} />
                </button>
              )}
            </article>
          ))}
        </div>

        <p className="px-4 py-3 text-xs text-ink-faint">
          <span className="font-semibold text-online">{t("conversa.fixadas.dicaRotulo")}</span>{" "}
          {t("conversa.fixadas.dica")}
        </p>
      </PopoverContent>
    </Popover>
  );
};
