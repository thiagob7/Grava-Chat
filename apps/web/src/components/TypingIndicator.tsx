import React, { useEffect, useState } from "react";

import { Avatar } from "~/components/Avatar";
import { useTypingStore } from "~/stores/typing-store";
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
  if (!users.length) return <div className="h-6" />;

  const names = users.map((entry) => entry.user.displayName);
  const text =
    names.length === 1
      ? t("conversa.digitando.um", { nome: names[0] })
      : names.length === 2
        ? t("conversa.digitando.dois", { primeiro: names[0], segundo: names[1] })
        : t("conversa.digitando.varios", { quantidade: names.length });

  return (
    <div className="flex h-6 items-center gap-2 px-3 text-xs text-ink-muted">
      {/*
        O retrato de quem digita, e não só o nome.

        Numa conversa movimentada o nome sozinho obriga a LER pra saber quem é;
        o rosto se reconhece antes da leitura. É o mesmo motivo de a lista de
        mensagens ter avatar em vez de só o nome do autor.

        Até três, e sobrepostos: a linha tem 24px de altura e divide espaço com
        a frase, que já diz quantas pessoas são quando passam de duas. Mais
        retratos empurrariam o texto pra fora antes de acrescentar informação.
      */}
      <span className="flex shrink-0 -space-x-1.5">
        {users.slice(0, 3).map((entry) => (
          <Avatar
            key={entry.user.id}
            id={entry.user.id}
            name={entry.user.displayName}
            url={entry.user.avatarUrl}
            size={16}
            className="ring-2 ring-composer"
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
