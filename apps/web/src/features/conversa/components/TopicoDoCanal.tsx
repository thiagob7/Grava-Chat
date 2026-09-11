import React, { useState } from "react";
import { Info } from "@phosphor-icons/react";

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { MessageContent } from "~/features/conversa/components/MessageContent";
import { flx, flxCls } from "~/lib/compat-de-tema";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

export const ChannelTopic: React.FC<{
  name: string;
  topic: string;
  compact?: boolean;
}> = ({ name, topic, compact }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {compact ? (
        <button data-gc="conversa.topico-do-canal.button"
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label={t("conversa.topico.abrir")}
          title={t("conversa.topico.abrir")}
          className="shrink-0 rounded p-1 text-ink-faint transition hover:bg-surface-3 hover:text-ink"
        >
          <Info data-gc="conversa.topico-do-canal.info" size={18} weight="fill" />
        </button>
      ) : (
        <>
          <span data-gc="conversa.topico-do-canal.span" {...flx("topicDivider", "mx-1 h-5 w-px shrink-0 bg-line")} />

          <button data-gc="conversa.topico-do-canal.button--2"
            type="button"
            onClick={() => setIsOpen(true)}
            title={t("conversa.topico.abrir")}
            className={cn(
              flxCls("channelTopic"),
              "min-w-0 truncate rounded px-1 py-0.5 text-left text-sm text-ink-muted transition hover:bg-surface-3 hover:text-ink",
            )}
          >
            {topic}
          </button>
        </>
      )}

      <Dialog data-gc="conversa.topico-do-canal.dialog.set-is-open" open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent data-gc="conversa.topico-do-canal.dialog-content" className="max-w-md">
          <DialogHeader data-gc="conversa.topico-do-canal.dialog-header">
            <DialogTitle data-gc="conversa.topico-do-canal.dialog-title">#{name}</DialogTitle>
          </DialogHeader>

          <DialogBody data-gc="conversa.topico-do-canal.dialog-body">
            <div data-gc="conversa.topico-do-canal.div" className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">
              <MessageContent data-gc="conversa.topico-do-canal.message-content" content={topic} emojis={[]} />
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
};
