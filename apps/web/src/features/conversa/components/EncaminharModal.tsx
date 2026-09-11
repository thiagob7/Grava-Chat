import React, { useMemo, useState } from "react";
import { Hash, Search, Send } from "lucide-react";
import type { Message } from "@gravae/shared";

import { useSendMessage } from "~/@core/application/queries/message/use-send-message";
import { useFindDms } from "~/@core/application/queries/friend/use-find-dms";
import { useFindGuild } from "~/@core/application/queries/guild/use-find-guild";
import { Avatar } from "~/features/perfil/components/Avatar";
import { Dialog, DialogBody, DialogContent, DialogTitle } from "~/components/ui/dialog";
import { bareField, fieldGroup } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

interface Destination {
  id: string;
  name: string;
  avatar?: { id: string; url: string | null };
}

interface ForwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message;
  guildId?: string;
}

export const ForwardModal: React.FC<ForwardModalProps> = ({
  isOpen,
  onClose,
  message,
  guildId,
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [sendingFor, setSendingFor] = useState<string | null>(null);

  const guild = useFindGuild(guildId);
  const dms = useFindDms(isOpen);
  const sendMessage = useSendMessage();

  const destinations = useMemo<{ channels: Destination[]; chats: Destination[] }>(() => {
    const term = search.toLowerCase().trim();
    const fits = (name: string) => !term || name.toLowerCase().includes(term);

    return {
      channels: (guild.data?.channels ?? [])
        .filter((c) => c.type === "TEXT" && c.id !== message.channelId && fits(c.name))
        .map((c) => ({ id: c.id, name: c.name })),

      chats: (dms.data ?? [])
        .filter((d) => d.id !== message.channelId && fits(d.user.displayName))
        .map((d) => ({
          id: d.id,
          name: d.user.displayName,
          avatar: { id: d.user.id, url: d.user.avatarUrl },
        })),
    };
  }, [guild.data, dms.data, search, message.channelId]);

  const forward = (destination: Destination) => {
    setSendingFor(destination.id);

    sendMessage.mutate(
      {
        channelId: destination.id,
        content: message.content || t("conversa.encaminhar.semTexto"),
        forwarded: { channelId: message.channelId, messageId: message.id },
        nonce: crypto.randomUUID(),
      },
      { onSettled: () => (setSendingFor(null), onClose()) },
    );
  };

  const empty = !destinations.channels.length && !destinations.chats.length;

  return (
    <Dialog data-gc="conversa.encaminhar-modal.dialog" open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent data-gc="conversa.encaminhar-modal.dialog-content" className="max-w-md">
        <DialogTitle data-gc="conversa.encaminhar-modal.dialog-title">{t("conversa.encaminhar.titulo")}</DialogTitle>

        <DialogBody data-gc="conversa.encaminhar-modal.dialog-body">
          <div data-gc="conversa.encaminhar-modal.div" className={fieldGroup}>
            <Search data-gc="conversa.encaminhar-modal.search" size={14} className="shrink-0 text-ink-faint" />
            <input data-gc="conversa.encaminhar-modal.input"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("conversa.encaminhar.paraOnde")}
              className={bareField}
            />
          </div>

          <p data-gc="conversa.encaminhar-modal.p" className="mt-3 line-clamp-2 rounded bg-surface-0 px-3 py-2 text-xs text-ink-faint">
            {message.content || t("conversa.encaminhar.semTexto")}
          </p>

          <div data-gc="conversa.encaminhar-modal.div--2" className="mt-3 max-h-64 space-y-3 overflow-y-auto">
            {empty && (
              <p data-gc="conversa.encaminhar-modal.p--2" className="py-8 text-center text-sm text-ink-faint">
                {t("conversa.encaminhar.nenhumLugar")}
              </p>
            )}

            <Group data-gc="conversa.encaminhar-modal.group.forward"
              title={t("conversa.encaminhar.canais")}
              items={destinations.channels}
              sendingFor={sendingFor}
              onPick={forward}
            />
            <Group data-gc="conversa.encaminhar-modal.group.forward--2"
              title={t("conversa.encaminhar.conversas")}
              items={destinations.chats}
              sendingFor={sendingFor}
              onPick={forward}
            />
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

const Group: React.FC<{
  title: string;
  items: Destination[];
  sendingFor: string | null;
  onPick: (d: Destination) => void;
}> = ({ title, items, sendingFor, onPick }) => {
  if (!items.length) return null;

  return (
    <section data-gc="conversa.encaminhar-modal.section">
      <h4 data-gc="conversa.encaminhar-modal.h4" className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {title}
      </h4>

      {items.map((destination) => (
        <button data-gc="conversa.encaminhar-modal.button"
          key={destination.id}
          disabled={sendingFor !== null}
          onClick={() => onPick(destination)}
          className={cn(
            "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition",
            "hover:bg-surface-3 disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {destination.avatar ? (
            <Avatar data-gc="conversa.encaminhar-modal.avatar"
              id={destination.avatar.id}
              name={destination.name}
              url={destination.avatar.url}
              size={20}
            />
          ) : (
            <Hash data-gc="conversa.encaminhar-modal.hash" size={16} className="shrink-0 text-ink-faint" />
          )}

          <span data-gc="conversa.encaminhar-modal.span" className="min-w-0 flex-1 truncate">{destination.name}</span>

          {sendingFor === destination.id && <Send data-gc="conversa.encaminhar-modal.send" size={14} className="shrink-0 text-brand" />}
        </button>
      ))}
    </section>
  );
};
