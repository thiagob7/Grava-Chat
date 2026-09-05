import React, { useEffect, useState } from "react";

import { Avatar } from "~/features/perfil/components/Avatar";
import { useTypingStore } from "~/features/conversa/stores/typing-store";
import { useTranslation } from "~/traducao";

interface TypingIndicatorProps {
  channelId: string;
  currentUserId: string | undefined;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ channelId, currentUserId }) => {
  const { t } = useTranslation();
  const byChannel = useTypingStore((s) => s.byChannel);
  const activeIn = useTypingStore((s) => s.activeIn);

  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  void byChannel;
  const users = activeIn(channelId, currentUserId);

  /*
    Sem ninguém digitando, o aviso não ocupa espaço nenhum: ele flutua por
    cima da caixa em vez de empurrá-la. Antes uma faixa de 24px ficava
    reservada o tempo todo só para não haver salto quando alguém começasse.
  */
  if (!users.length) return null;

  const names = users.map((entry) => entry.user.displayName);
  const text =
    names.length === 1
      ? t("conversa.digitando.um", { nome: names[0] })
      : names.length === 2
        ? t("conversa.digitando.dois", { primeiro: names[0], segundo: names[1] })
        : t("conversa.digitando.varios", { quantidade: names.length });

  return (
    <div className="pointer-events-none absolute -top-3 left-3 z-10 flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-full border border-line bg-surface-2/80 px-2.5 py-1 text-xs text-ink-muted shadow-lg backdrop-blur-md">
      <span className="flex shrink-0 -space-x-1.5">
        {users.slice(0, 3).map((entry) => (
          <Avatar
            key={entry.user.id}
            id={entry.user.id}
            name={entry.user.displayName}
            url={entry.user.avatarUrl}
            size={16}
            className="ring-2 ring-surface-2"
          />
        ))}
      </span>

      <span className="flex gap-0.5">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="size-1 animate-bounce rounded-full bg-ink-muted"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </span>

      <span className="min-w-0 truncate font-medium">{text}</span>
    </div>
  );
};
