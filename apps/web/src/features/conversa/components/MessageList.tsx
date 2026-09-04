import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { Hash, Lock } from "lucide-react";

import { useFindMessages } from "~/@core/application/queries/message/use-find-messages";
import { useSendMessage } from "~/@core/application/queries/message/use-send-message";
import type { PendingMessageModel } from "~/@core/domain/models/message-model";
import { useMarkRead } from "~/@core/application/queries/message/use-mark-read";
import { useFindExpressions } from "~/@core/application/queries/expression/use-expressions";
import { usePinMessage } from "~/@core/application/queries/message/use-pins";
import { MessageItem, shouldGroup } from "~/features/conversa/components/MessageItem";
import { useEnfeites } from "~/hooks/use-enfeites";
import { useMencoes } from "~/features/conversa/hooks/use-mencoes";
import { formatDayDivider } from "~/lib/format";
import { larguraDaLinha, Skeleton } from "~/components/ui/skeleton";
import { useTranslation } from "~/traducao";

interface MessageListProps {
  channelId: string;
  channelName: string;
  currentUserId: string | undefined;
  isModerator: boolean;
  guildId?: string;
  postId?: string;
  header?: React.ReactNode;
}

export const MessageList: React.FC<MessageListProps> = ({
  channelId,
  channelName,
  currentUserId,
  isModerator,
  guildId,
  postId,
  header,
}) => {
  const { t } = useTranslation();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useFindMessages(
    channelId,
    postId,
  );
  const { data: expressoes } = useFindExpressions(guildId);
  const enfeitesDe = useEnfeites(guildId);
  const mencoes = useMencoes(guildId, false, currentUserId);
  const pinMessage = usePinMessage(channelId);
  const sendMessage = useSendMessage();
  const markRead = useMarkRead();

  const scroller = useRef<HTMLDivElement>(null);
  const conteudo = useRef<HTMLDivElement>(null);
  const bottomAnchor = useRef(true);
  const previousHeight = useRef(0);

  const [params, setParams] = useSearchParams();
  const alvo = params.get("m");
  const [destacada, setDestacada] = useState<string | null>(null);
  const paginasPedidas = useRef(0);

  const messages = useMemo(
    () => [...(data?.pages ?? [])].reverse().flatMap((page) => page.messages) as PendingMessageModel[],
    [data],
  );

  const semHistorico = data?.pages?.some((page) => page.semHistorico) ?? false;

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;

    if (messages.at(-1)?.author.id === currentUserId) bottomAnchor.current = true;

    if (bottomAnchor.current) {
      el.scrollTop = el.scrollHeight;
      return;
    }

    if (previousHeight.current && el.scrollHeight > previousHeight.current) {
      el.scrollTop += el.scrollHeight - previousHeight.current;
    }

    previousHeight.current = el.scrollHeight;
  }, [messages, currentUserId]);

  useEffect(() => {
    bottomAnchor.current = true;
    previousHeight.current = 0;
    paginasPedidas.current = 0;
  }, [channelId]);

  useEffect(() => {
    const alvo = conteudo.current;
    const caixa = scroller.current;
    if (!alvo || !caixa || typeof ResizeObserver === "undefined") return;

    const observador = new ResizeObserver(() => {
      if (!bottomAnchor.current) return;
      caixa.scrollTop = caixa.scrollHeight;
    });

    observador.observe(alvo);
    return () => observador.disconnect();
  }, [channelId]);

  useEffect(() => {
    if (!alvo) return setDestacada(null);

    const elemento = scroller.current?.querySelector(`[data-mensagem="${alvo}"]`);

    if (!elemento) {
      if (paginasPedidas.current < 8 && hasNextPage && !isFetchingNextPage) {
        paginasPedidas.current += 1;
        previousHeight.current = scroller.current?.scrollHeight ?? 0;
        void fetchNextPage();
      }
      return;
    }

    bottomAnchor.current = false;
    elemento.scrollIntoView({ block: "center" });
    setDestacada(alvo);

    const relogio = setTimeout(() => {
      setDestacada(null);
      setParams(
        (atuais) => {
          const proximos = new URLSearchParams(atuais);
          proximos.delete("m");
          return proximos;
        },
        { replace: true },
      );
    }, 2_500);

    return () => clearTimeout(relogio);
  }, [alvo, messages, hasNextPage, isFetchingNextPage, fetchNextPage, setParams]);

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
    return (
      <div
        aria-busy
        aria-label={t("conversa.lista.carregando")}
        className="@container flex-1 overflow-hidden pt-4"
      >
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="mt-4 flex gap-x-2 px-2 @sm:gap-x-4 @sm:px-4">
            <Skeleton className="size-10 shrink-0 rounded-full" />

            <div className="min-w-0 flex-1 space-y-2 py-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3.5 w-28 rounded-sm" />
                <Skeleton className="h-2.5 w-16 rounded-sm" />
              </div>

              <Skeleton
                className="h-3 rounded-sm"
                style={{ width: larguraDaLinha(i) }}
              />
              {i % 3 !== 1 && (
                <Skeleton
                  className="h-3 rounded-sm"
                  style={{ width: larguraDaLinha(i + 3) }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const porId = new Map(messages.map((m) => [m.id, m]));

  let lastDay = "";

  return (
    <div
      ref={scroller}
      onScroll={onScroll}
      className="@container flex-1 overflow-y-auto pt-4"
    >
      <div ref={conteudo} className="pb-[var(--gc-rodape,1rem)]">
      {hasNextPage ? (
        <p className="py-3 text-center text-xs text-ink-faint">
          {t(isFetchingNextPage ? "conversa.lista.carregandoMais" : "conversa.lista.verMais")}
        </p>
      ) : (
        (header ?? (
          <div className="px-2 pb-6 pt-4 @sm:px-4">
            <div className="mb-3 flex size-16 items-center justify-center rounded-full bg-surface-4">
              {semHistorico ? (
                <Lock size={32} className="text-ink-muted" />
              ) : (
                <Hash size={36} className="text-ink" />
              )}
            </div>
            {semHistorico ? (
              <>
                <h2 className="text-2xl font-bold">{t("conversa.lista.semHistorico")}</h2>
                <p className="mt-1 text-ink-muted">
                  {t("conversa.lista.semHistoricoDetalhe", { canal: channelName })}
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold">
                  {t("conversa.lista.boasVindas", { canal: channelName })}
                </h2>
                <p className="mt-1 text-ink-muted">
                  {t("conversa.lista.boasVindasDetalhe", { canal: channelName })}
                </p>
              </>
            )}
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
              <div className="my-4 flex items-center gap-2 px-2 @sm:px-4">
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
              guildId={guildId}
              respondida={message.replyToId ? porId.get(message.replyToId) : undefined}
              emojis={expressoes.emojis}
              enfeites={enfeitesDe(message.author.id)}
              mencoes={mencoes}
              meMenciona={mencoes.mencionaVoce(message)}
              destacada={message.id === destacada}
              canDelete={message.author.id === currentUserId || isModerator}
              canPin={isModerator}
              onPin={(alvo, fixar) => pinMessage.mutate({ messageId: alvo.id, pin: fixar })}
              onRetry={retry}
            />
          </div>
        );
      })}
      </div>
    </div>
  );
};
