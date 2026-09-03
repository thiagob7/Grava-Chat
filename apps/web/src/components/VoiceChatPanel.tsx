import React from "react";
import { useTranslation } from "~/traducao";
import { MessageSquare, X } from "lucide-react";

import { AreaDeConversa, RodapeDaConversa } from "~/components/AreaDeConversa";
import { Composer } from "~/components/Composer";
import { MessageList } from "~/components/MessageList";
import { AlcaDeLargura, useLarguraAjustavel } from "~/components/ui/resizable";

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
  const { largura, arrastando, alca, limites } = useLarguraAjustavel("chat-da-voz", {
    padrao: 384,
    min: 280,
    max: 620,
    borda: "esquerda",
  });

  return (
    <aside
      className="relative flex shrink-0 flex-col border-l border-divisor bg-surface-2"
      style={{ width: largura }}
    >
      <AlcaDeLargura borda="esquerda" arrastando={arrastando} largura={largura} limites={limites} {...alca} />
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-divisor px-4 shadow-sm">
      <MessageSquare size={18} className="text-ink-faint" />
      <h2 className="min-w-0 flex-1 truncate font-semibold">{channelName}</h2>

      <button
        onClick={onClose}
        aria-label={t("chamada.fecharChat")}
        className="text-ink-muted transition hover:text-ink"
      >
        <X size={18} />
      </button>
    </header>

    <AreaDeConversa>
    <MessageList
      channelId={channelId}
      channelName={channelName}
      guildId={guildId}
      currentUserId={currentUserId}
      isModerator={isModerator}
    />

    <RodapeDaConversa>
      <Composer
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
