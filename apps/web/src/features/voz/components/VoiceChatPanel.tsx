import React from "react";
import { useTranslation } from "~/traducao";
import { MessageSquare, X } from "lucide-react";

import {
  AreaDeConversa,
  PainelDaConversa,
  RodapeDaConversa,
} from "~/features/conversa/components/AreaDeConversa";
import { Composer } from "~/features/conversa/components/Composer";
import { MessageList } from "~/features/conversa/components/MessageList";
import { WidthHandle, useResizableWidth } from "~/components/ui/resizable";

interface VoiceChatPanelProps {
  channelId: string;
  channelName: string;
  guildId: string;
  currentUserId: string | undefined;
  isModerator: boolean;
  podeEscrever: boolean;
  onClose: () => void;
}

export const VoiceChatPanel: React.FC<VoiceChatPanelProps> = ({
  channelId,
  channelName,
  guildId,
  currentUserId,
  isModerator,
  podeEscrever,
  onClose,
}) => {
  const { t } = useTranslation();
  const { width, dragging, handle, bounds } = useResizableWidth("chat-da-voz", {
    initial: 384,
    min: 280,
    max: 620,
    edge: "left",
  });

  return (
    <aside data-gc="voz.voice-chat-panel.aside"
      className="relative flex shrink-0 flex-col border-l border-divisor bg-surface-2"
      style={{ width: width }}
    >
      <WidthHandle data-gc="voz.voice-chat-panel.width-handle" edge="left" dragging={dragging} width={width} bounds={bounds} {...handle} />
    <header data-gc="voz.voice-chat-panel.header" className="flex h-12 shrink-0 items-center gap-2 border-b border-divisor px-4 shadow-sm">
      <MessageSquare data-gc="voz.voice-chat-panel.message-square" size={18} className="text-ink-faint" />
      <h2 data-gc="voz.voice-chat-panel.h2" className="min-w-0 flex-1 truncate font-semibold">{channelName}</h2>

      <button data-gc="voz.voice-chat-panel.button.on-close"
        onClick={onClose}
        aria-label={t("chamada.fecharChat")}
        className="text-ink-muted transition hover:text-ink"
      >
        <X data-gc="voz.voice-chat-panel.x" size={18} />
      </button>
    </header>

    <AreaDeConversa data-gc="voz.voice-chat-panel.area-de-conversa">
      <PainelDaConversa data-gc="voz.voice-chat-panel.painel-da-conversa">
      <MessageList data-gc="voz.voice-chat-panel.message-list"
        channelId={channelId}
        channelName={channelName}
        guildId={guildId}
        currentUserId={currentUserId}
        isModerator={isModerator}
      />

      </PainelDaConversa>

    <RodapeDaConversa data-gc="voz.voice-chat-panel.rodape-da-conversa">
      <Composer data-gc="voz.voice-chat-panel.composer"
        channelId={channelId}
        channelName={channelName}
        guildId={guildId}
        podeEscrever={podeEscrever}
      />
    </RodapeDaConversa>
    </AreaDeConversa>
    </aside>
  );
};
