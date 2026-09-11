import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { Hash, Lock } from "lucide-react";

import { useFindMessages } from "~/@core/application/queries/message/use-find-messages";
import { useSendMessage } from "~/@core/application/queries/message/use-send-message";
import type { PendingMessageModel } from "~/@core/domain/models/message-model";
import { useMarkRead } from "~/@core/application/queries/message/use-mark-read";
import { useFindFriends } from "~/@core/application/queries/friend/use-find-friends";
import { useFindExpressions } from "~/@core/application/queries/expression/use-expressions";
import { usePinMessage } from "~/@core/application/queries/message/use-pins";
import { MessageItem, shouldGroup } from "~/features/conversa/components/MessageItem";
import { useCharms } from "~/features/perfil/hooks/use-enfeites";
import { useMentions } from "~/features/conversa/hooks/use-mencoes";
import { formatDayDivider } from "~/lib/format";
import { lineWidth, Skeleton } from "~/components/ui/skeleton";
import { useTranslation } from "~/traducao";
import { flx, flxAttr, flxCls } from "~/lib/compat-de-tema";
import { cn } from "~/lib/utils";

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
  const { data: expressions } = useFindExpressions(guildId);
  const charms = useCharms(guildId);
  const mentions = useMentions(guildId, false, currentUserId);
  const pinMessage = usePinMessage(channelId);
  const sendMessage = useSendMessage();
  const markRead = useMarkRead();

  const scroller = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const bottomAnchor = useRef(true);
  const previousHeight = useRef(0);

  const [params, setParams] = useSearchParams();
  const target = params.get("m");
  const [highlighted, setHighlighted] = useState<string | null>(null);

  const { data: friendships = [] } = useFindFriends(Boolean(currentUserId));
  const blocked = useMemo(
    () => new Set(friendships.filter((a) => a.status === "BLOCKED").map((a) => a.user.id)),
    [friendships],
  );
  const [isOpen, setIsOpen] = useState<Set<string>>(() => new Set());
  const pagesRequested = useRef(0);

  const messages = useMemo(
    () => [...(data?.pages ?? [])].reverse().flatMap((page) => page.messages) as PendingMessageModel[],
    [data],
  );

  const withoutHistory = data?.pages?.some((page) => page.withoutHistory) ?? false;

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
    pagesRequested.current = 0;
  }, [channelId]);

  useEffect(() => {
    const target = content.current;
    const box = scroller.current;
    if (!target || !box || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      if (!bottomAnchor.current) return;
      box.scrollTop = box.scrollHeight;
    });

    observer.observe(target);
    observer.observe(box);

    return () => observer.disconnect();
  }, [channelId]);

  useEffect(() => {
    if (!target) return setHighlighted(null);

    const element = scroller.current?.querySelector(`[data-mensagem="${target}"]`);

    if (!element) {
      if (pagesRequested.current < 8 && hasNextPage && !isFetchingNextPage) {
        pagesRequested.current += 1;
        previousHeight.current = scroller.current?.scrollHeight ?? 0;
        void fetchNextPage();
      }
      return;
    }

    bottomAnchor.current = false;
    element.scrollIntoView({ block: "center" });
    setHighlighted(target);

    const clock = setTimeout(() => {
      setHighlighted(null);
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.delete("m");
          return next;
        },
        { replace: true },
      );
    }, 2_500);

    return () => clearTimeout(clock);
  }, [target, messages, hasNextPage, isFetchingNextPage, fetchNextPage, setParams]);

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
      <div data-gc="conversa.message-list.div"
        aria-busy
        aria-label={t("conversa.lista.carregando")}
        className="mede-a-largura flex-1 overflow-hidden pt-4"
      >
        {Array.from({ length: 8 }, (_, i) => (
          <div data-gc="conversa.message-list.div--2" key={i} className="mt-4 flex gap-x-2 px-2 @sm:gap-x-4 @sm:px-4">
            <Skeleton data-gc="conversa.message-list.skeleton" className="size-10 shrink-0 rounded-full" />

            <div data-gc="conversa.message-list.div--3" className="min-w-0 flex-1 space-y-2 py-1">
              <div data-gc="conversa.message-list.div--4" className="flex items-center gap-2">
                <Skeleton data-gc="conversa.message-list.skeleton--2" className="h-3.5 w-28 rounded-sm" />
                <Skeleton data-gc="conversa.message-list.skeleton--3" className="h-2.5 w-16 rounded-sm" />
              </div>

              <Skeleton data-gc="conversa.message-list.skeleton--4"
                className="h-3 rounded-sm"
                style={{ width: lineWidth(i) }}
              />
              {i % 3 !== 1 && (
                <Skeleton data-gc="conversa.message-list.skeleton--5"
                  className="h-3 rounded-sm"
                  style={{ width: lineWidth(i + 3) }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const byId = new Map(messages.map((m) => [m.id, m]));

  let lastDay = "";

  return (
    <div data-gc="conversa.message-list.div.on-scroll"
      ref={scroller}
      {...flxAttr("scrollerContent")}
      onScroll={onScroll}
      className={cn("lista-de-mensagens mede-a-largura flex-1 overflow-y-auto pt-4", flxCls("scroller"), flxCls("scrollerContent"))}
    >
      <div data-gc="conversa.message-list.div--5" ref={content} {...flx("messagesContent", "pb-4")}>
      {hasNextPage ? (
        <p data-gc="conversa.message-list.p" className="py-3 text-center text-xs text-ink-faint">
          {t(isFetchingNextPage ? "conversa.lista.carregandoMais" : "conversa.lista.verMais")}
        </p>
      ) : (
        (header ?? (
          <div data-gc="conversa.message-list.div--6" {...flx("channelGoodWelcome", "px-2 pb-6 pt-4 @sm:px-4")}>
            <div data-gc="conversa.message-list.div--7" className="mb-3 flex size-16 items-center justify-center rounded-full bg-surface-4">
              {withoutHistory ? (
                <Lock data-gc="conversa.message-list.lock" size={32} className="text-ink-muted" />
              ) : (
                <Hash data-gc="conversa.message-list.hash" size={36} className="text-ink" />
              )}
            </div>
            {withoutHistory ? (
              <>
                <h2 data-gc="conversa.message-list.h2" className="text-2xl font-bold">{t("conversa.lista.semHistorico")}</h2>
                <p data-gc="conversa.message-list.p--2" className="mt-1 text-ink-muted">
                  {t("conversa.lista.semHistoricoDetalhe", { canal: channelName })}
                </p>
              </>
            ) : (
              <>
                <h2 data-gc="conversa.message-list.h2--2" className="text-2xl font-bold">
                  {t("conversa.lista.boasVindas", { canal: channelName })}
                </h2>
                <p data-gc="conversa.message-list.p--3" className="mt-1 text-ink-muted">
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

        if (blocked.has(message.author.id) && !isOpen.has(message.id)) {
          const anterior = messages[index - 1];
          if (anterior && blocked.has(anterior.author.id) && !isOpen.has(anterior.id)) {
            return null;
          }

          let count = 0;
          const ids: string[] = [];
          for (let i = index; i < messages.length; i++) {
            const m = messages[i]!;
            if (!blocked.has(m.author.id) || isOpen.has(m.id)) break;
            count++;
            ids.push(m.id);
          }

          return (
            <div data-gc="conversa.message-list.div--8" key={message.id}>
              <button data-gc="conversa.message-list.button"
                type="button"
                onClick={() => setIsOpen((current) => new Set([...current, ...ids]))}
                className={cn(
                  flxCls("blockedGroup"),
                  "mx-2 my-1 flex items-center gap-2 rounded px-3 py-1 text-xs text-ink-faint transition hover:bg-hover hover:text-ink @sm:mx-4",
                )}
              >
                {t("conversa.mensagem.bloqueadas", { quantas: count })}
                <span data-gc="conversa.message-list.span" className="font-medium">{t("conversa.mensagem.mostrarBloqueadas")}</span>
              </button>
            </div>
          );
        }

        return (
          <div data-gc="conversa.message-list.div--9" key={message.id}>
            {isNewDay && (
              <div data-gc="conversa.message-list.div--10" className="my-4 flex items-center gap-2 px-2 @sm:px-4">
                <span data-gc="conversa.message-list.span--2" className="h-px flex-1 bg-line" />
                <span data-gc="conversa.message-list.span--3" {...flx("dayDivider", "text-xs font-semibold text-ink-faint")}>
                  {formatDayDivider(message.createdAt)}
                </span>
                <span data-gc="conversa.message-list.span--4" className="h-px flex-1 bg-line" />
              </div>
            )}
            <MessageItem data-gc="conversa.message-list.message-item.retry"
              message={message}
              compact={!isNewDay && shouldGroup(messages[index - 1], message)}
              isOwn={message.author.id === currentUserId}
              currentUserId={currentUserId}
              guildId={guildId}
              replied={message.replyToId ? byId.get(message.replyToId) : undefined}
              emojis={expressions.emojis}
              charms={charms(message.author.id)}
              mentions={mentions}
              meMentions={mentions.mentionsYou(message)}
              highlighted={message.id === highlighted}
              canDelete={message.author.id === currentUserId || isModerator}
              canPin={isModerator}
              onPin={(target, pin) => pinMessage.mutate({ messageId: target.id, pin: pin })}
              onRetry={retry}
            />
          </div>
        );
      })}
      </div>
    </div>
  );
};
