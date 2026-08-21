import React, { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Hash } from "lucide-react";

import { useFindMessages } from "~/@core/application/queries/message/use-find-messages";
import { useSendMessage } from "~/@core/application/queries/message/use-send-message";
import type { PendingMessageModel } from "~/@core/domain/models/message-model";
import { useMarkRead } from "~/@core/application/queries/message/use-mark-read";
import { useFindExpressions } from "~/@core/application/queries/expression/use-expressions";
import { usePinMessage } from "~/@core/application/queries/message/use-pins";
import { MessageItem, shouldGroup } from "~/components/MessageItem";
import { formatDayDivider } from "~/lib/format";

interface MessageListProps {
  channelId: string;
  channelName: string;
  currentUserId: string | undefined;
  isModerator: boolean;
  /** servidor do canal: de lá vêm os emojis customizados */
  guildId?: string;
  tag?: string | null;
  tagIcon?: string | null;
  /** conversa de um assunto do fórum */
  postId?: string;
  /** Cabeçalho do começo da conversa. A DM mostra a pessoa; o canal, o #nome. */
  header?: React.ReactNode;
}

export const MessageList: React.FC<MessageListProps> = ({
  channelId,
  channelName,
  currentUserId,
  isModerator,
  guildId,
  postId,
  tag,
  tagIcon,
  header,
}) => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useFindMessages(
    channelId,
    postId,
  );
  const { data: expressoes } = useFindExpressions(guildId);
  const pinMessage = usePinMessage(channelId);
  const sendMessage = useSendMessage();
  const markRead = useMarkRead();

  const scroller = useRef<HTMLDivElement>(null);
  const bottomAnchor = useRef(true);
  const previousHeight = useRef(0);

  /**
   * A página 0 é a mais nova. Invertendo as páginas e achatando, sai a ordem
   * cronológica que a tela precisa.
   */
  const messages = useMemo(
    () => [...(data?.pages ?? [])].reverse().flatMap((page) => page.messages) as PendingMessageModel[],
    [data],
  );

  /**
   * Rola pro fim só quando o usuário já estava no fim. Se ele subiu pra ler
   * histórico, uma mensagem nova não pode arrancar a tela dele.
   */
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;

    /**
     * Mandar mensagem sempre te leva pro fim, mesmo que você estivesse lendo o
     * histórico. É o que o Discord faz — e sem isso a mensagem que você acabou
     * de escrever some pra baixo da tela.
     */
    if (messages.at(-1)?.author.id === currentUserId) bottomAnchor.current = true;

    if (bottomAnchor.current) {
      el.scrollTop = el.scrollHeight;
      return;
    }

    // Carregou mensagens antigas: mantém a posição de leitura compensando a
    // altura que apareceu acima. Sem isso, o conteúdo "pula".
    if (previousHeight.current && el.scrollHeight > previousHeight.current) {
      el.scrollTop += el.scrollHeight - previousHeight.current;
    }

    previousHeight.current = el.scrollHeight;
  }, [messages, currentUserId]);

  useEffect(() => {
    bottomAnchor.current = true;
    previousHeight.current = 0;
  }, [channelId]);

  const markCurrentRead = () => {
    const last = messages.findLast((m) => !m.pending && !m.failed);
    if (last) markRead(channelId, last.id);
  };

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;

    bottomAnchor.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (bottomAnchor.current) markCurrentRead();

    if (el.scrollTop < 200 && hasNextPage && !isFetchingNextPage) {
      previousHeight.current = el.scrollHeight;
      void fetchNextPage();
    }
  };

  const retry = (message: PendingMessageModel) => {
    sendMessage.mutate({
      channelId,
      content: message.content,
      replyToId: message.replyToId,
      nonce: crypto.randomUUID(),
    });
  };

  if (isLoading) {
    return <div className="flex-1 p-6 text-sm text-ink-faint">Carregando mensagens…</div>;
  }

  let lastDay = "";

  return (
    <div ref={scroller} onScroll={onScroll} className="flex-1 overflow-y-auto py-4">
      {hasNextPage ? (
        <p className="py-3 text-center text-xs text-ink-faint">
          {isFetchingNextPage ? "Carregando…" : "Role para cima para ver mais"}
        </p>
      ) : (
        (header ?? (
          <div className="px-4 pb-6 pt-4">
            <div className="mb-3 flex size-16 items-center justify-center rounded-full bg-surface-4">
              <Hash size={36} className="text-ink" />
            </div>
            <h2 className="text-2xl font-bold">Bem-vindo a #{channelName}</h2>
            <p className="mt-1 text-ink-muted">Este é o começo do canal #{channelName}.</p>
          </div>
        ))
      )}

      {messages.map((message, index) => {
        const day = new Date(message.createdAt).toDateString();
        const isNewDay = day !== lastDay;
        lastDay = day;

        return (
          <div key={message.id}>
            {isNewDay && (
              <div className="my-4 flex items-center gap-2 px-4">
                <span className="h-px flex-1 bg-line" />
                <span className="text-xs font-semibold text-ink-faint">
                  {formatDayDivider(message.createdAt)}
                </span>
                <span className="h-px flex-1 bg-line" />
              </div>
            )}
            <MessageItem
              message={message}
              compact={!isNewDay && shouldGroup(messages[index - 1], message)}
              isOwn={message.author.id === currentUserId}
              currentUserId={currentUserId}
              emojis={expressoes.emojis}
              tag={tag}
              tagIcon={tagIcon}
              canDelete={message.author.id === currentUserId || isModerator}
              canPin={isModerator}
              onPin={(alvo, fixar) => pinMessage.mutate({ messageId: alvo.id, pin: fixar })}
              onRetry={retry}
            />
          </div>
        );
      })}
    </div>
  );
};
