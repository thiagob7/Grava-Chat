import React from "react";
import { useTranslation } from "~/traducao";
import { MessageSquare, PanelBottom, PanelRight, X } from "lucide-react";

import {
  ChatArea,
  ChatPanel,
  ChatFooter,
} from "~/features/conversa/components/AreaDeConversa";
import { Composer } from "~/features/conversa/components/Composer";
import { MessageList } from "~/features/conversa/components/MessageList";
import {
  HeightHandle,
  WidthHandle,
  useResizableHeight,
  useResizableWidth,
} from "~/components/ui/resizable";
import { useVoiceChat } from "~/features/voz/stores/chat-da-voz";
import { Tooltip } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

interface VoiceChatPanelProps {
  channelId: string;
  channelName: string;
  guildId: string;
  currentUserId: string | undefined;
  isModerator: boolean;
  canWrite: boolean;
  onClose: () => void;
}

export const VoiceChatPanel: React.FC<VoiceChatPanelProps> = ({
  channelId,
  channelName,
  guildId,
  currentUserId,
  isModerator,
  canWrite,
  onClose,
}) => {
  const { t } = useTranslation();
  const side = useVoiceChat((s) => s.side);
  const setSide = useVoiceChat((s) => s.setSide);

  const width = useResizableWidth("chat-da-voz", {
    initial: 384,
    min: 280,
    max: 620,
    edge: "left",
  });

  const height = useResizableHeight("chat-da-voz", { initial: 320, min: 180, max: 720 });

  const below = side === "baixo";

  return (
    <aside data-gc="voz.voice-chat-panel.aside"
      className={cn(
        "relative flex shrink-0 flex-col bg-surface-2",
        below ? "w-full border-t border-divisor" : "border-l border-divisor",
      )}
      style={below ? { height: height.height } : { width: width.width }}
    >
      {below ? (
        <HeightHandle data-gc="voz.voice-chat-panel.height-handle"
          dragging={height.dragging}
          height={height.height}
          bounds={height.bounds}
          {...height.handle}
        />
      ) : (
        <WidthHandle data-gc="voz.voice-chat-panel.width-handle"
          edge="left"
          dragging={width.dragging}
          width={width.width}
          bounds={width.bounds}
          {...width.handle}
        />
      )}
    <header data-gc="voz.voice-chat-panel.header" className="flex h-12 shrink-0 items-center gap-2 border-b border-divisor px-4 shadow-sm">
      <MessageSquare data-gc="voz.voice-chat-panel.message-square" size={18} className="text-ink-faint" />
      <h2 data-gc="voz.voice-chat-panel.h2" className="min-w-0 flex-1 truncate font-semibold">{channelName}</h2>

      <Tooltip data-gc="voz.voice-chat-panel.tooltip"
        label={below ? t("chamada.chat.paraOLado") : t("chamada.chat.paraBaixo")}
      >
        <button data-gc="voz.voice-chat-panel.button"
          type="button"
          onClick={() => setSide(below ? "direita" : "baixo")}
          aria-label={below ? t("chamada.chat.paraOLado") : t("chamada.chat.paraBaixo")}
          className="text-ink-muted transition hover:text-ink"
        >
          {below ? (
            <PanelRight data-gc="voz.voice-chat-panel.panel-right" size={18} />
          ) : (
            <PanelBottom data-gc="voz.voice-chat-panel.panel-bottom" size={18} />
          )}
        </button>
      </Tooltip>

      <button data-gc="voz.voice-chat-panel.button.on-close"
        onClick={onClose}
        aria-label={t("chamada.fecharChat")}
        className="text-ink-muted transition hover:text-ink"
      >
        <X data-gc="voz.voice-chat-panel.x" size={18} />
      </button>
    </header>

    <ChatArea data-gc="voz.voice-chat-panel.chat-area">
      <ChatPanel data-gc="voz.voice-chat-panel.chat-panel">
      <MessageList data-gc="voz.voice-chat-panel.message-list"
        channelId={channelId}
        channelName={channelName}
        guildId={guildId}
        currentUserId={currentUserId}
        isModerator={isModerator}
      />

      </ChatPanel>

    <ChatFooter data-gc="voz.voice-chat-panel.chat-footer">
      <Composer data-gc="voz.voice-chat-panel.composer"
        channelId={channelId}
        channelName={channelName}
        guildId={guildId}
        canWrite={canWrite}
      />
    </ChatFooter>
    </ChatArea>
    </aside>
  );
};
