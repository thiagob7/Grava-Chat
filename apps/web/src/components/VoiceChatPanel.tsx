import React from "react";
import { MessageSquare, X } from "lucide-react";

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

/**
 * O chat que fica ao lado da chamada. É o mesmo canal: as mensagens vão pro
 * canal de voz, e quem abrir o chat depois vê tudo que rolou.
 */
export const VoiceChatPanel: React.FC<VoiceChatPanelProps> = ({
  channelId,
  channelName,
  guildId,
  currentUserId,
  isModerator,
  podeEscrever,
  onClose,
}) => {
  const { largura, arrastando, alca, limites } = useLarguraAjustavel("chat-da-voz", {
    padrao: 384,
    min: 280,
    max: 620,
    borda: "esquerda",
  });

  return (
    <aside
      className="relative flex shrink-0 flex-col border-l border-black/20 bg-surface-2"
      style={{ width: largura }}
    >
      <AlcaDeLargura borda="esquerda" arrastando={arrastando} largura={largura} limites={limites} {...alca} />
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-black/20 px-4 shadow-sm">
      <MessageSquare size={18} className="text-ink-faint" />
      <h2 className="min-w-0 flex-1 truncate font-semibold">{channelName}</h2>

      <button
        onClick={onClose}
        aria-label="Fechar chat"
        className="text-ink-muted transition hover:text-ink"
      >
        <X size={18} />
      </button>
    </header>

    <MessageList
      channelId={channelId}
      channelName={channelName}
      guildId={guildId}
      currentUserId={currentUserId}
      isModerator={isModerator}
    />

    <Composer
      channelId={channelId}
      channelName={channelName}
      guildId={guildId}
      podeEscrever={podeEscrever}
    />
    </aside>
  );
};
