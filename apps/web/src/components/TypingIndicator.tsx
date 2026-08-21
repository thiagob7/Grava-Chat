import React, { useEffect, useState } from "react";

import { useTypingStore } from "~/stores/typing-store";

interface TypingIndicatorProps {
  channelId: string;
  currentUserId: string | undefined;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ channelId, currentUserId }) => {
  const byChannel = useTypingStore((s) => s.byChannel);
  const activeIn = useTypingStore((s) => s.activeIn);

  /**
   * Não existe evento de "parou de digitar": cada entrada expira sozinha por
   * TTL. Este tick é o que faz a linha sumir da tela quando isso acontece.
   */
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  void byChannel;
  const users = activeIn(channelId, currentUserId);
  if (!users.length) return <div className="h-6" />;

  const names = users.map((entry) => entry.user.displayName);
  const text =
    names.length === 1
      ? `${names[0]} está digitando…`
      : names.length === 2
        ? `${names[0]} e ${names[1]} estão digitando…`
        : `${names.length} pessoas estão digitando…`;

  return (
    <div className="flex h-6 items-center gap-2 px-5 text-xs text-ink-muted">
      <span className="flex gap-0.5">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="size-1 animate-bounce rounded-full bg-ink-muted"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </span>
      <span className="font-medium">{text}</span>
    </div>
  );
};
