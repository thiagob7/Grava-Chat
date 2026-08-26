import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { Hash, Lock } from "lucide-react";

import { useFindMessages } from "~/@core/application/queries/message/use-find-messages";
import { useSendMessage } from "~/@core/application/queries/message/use-send-message";
import type { PendingMessageModel } from "~/@core/domain/models/message-model";
import { useMarkRead } from "~/@core/application/queries/message/use-mark-read";
import { useFindExpressions } from "~/@core/application/queries/expression/use-expressions";
import { usePinMessage } from "~/@core/application/queries/message/use-pins";
import { MessageItem, shouldGroup } from "~/components/MessageItem";
import { useEnfeites } from "~/hooks/use-enfeites";
import { useMencoes } from "~/hooks/use-mencoes";
import { formatDayDivider } from "~/lib/format";

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

  /*
    A mensagem que alguém veio ver.

    O `?m=` na URL é escrito por quem manda pra cá — a busca e o painel do
    moderador. Ela pode não estar carregada: a lista começa no fim do canal, e
    o resultado pode ser de meses atrás. Então a gente pede mais páginas até
    achar, com teto — sem o teto, um id que não existe mais (mensagem apagada)
    baixaria o canal inteiro procurando.
  */
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

  /*
    A conversa cresce DEPOIS de ser desenhada.

    O cartão de um link chega quando a API responde; a imagem dele, quando
    termina de baixar; o mesmo vale para anexo, figurinha e GIF. Cada um
    desses empurra o conteúdo para baixo depois que o efeito de rolagem já
    rodou — e a última mensagem, que estava colada no fim, some atrás da caixa
    de escrever. Era isso que fazia o cartão do YouTube aparecer cortado no pé
    da tela.

    Um observador de tamanho resolve: enquanto você estiver ancorado no fim,
    qualquer crescimento do conteúdo leva a rolagem junto. Se você subiu para
    ler algo antigo, ele não mexe em nada.
  */
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

    /// Achou: para de puxar página, ancora nela em vez de no fim da lista, e
    /// acende por alguns segundos — tempo de o olho encontrar.
    bottomAnchor.current = false;
    elemento.scrollIntoView({ block: "center" });
    setDestacada(alvo);

    const relogio = setTimeout(() => {
      setDestacada(null);
      /// Tira o `?m=` da URL: sem isso, recarregar a página meses depois
      /// mandaria a lista caçar a mesma mensagem de novo.
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
    return <div className="flex-1 p-6 text-sm text-ink-faint">Carregando mensagens…</div>;
  }

  /// A citação precisa da mensagem respondida, e ela quase sempre já está
  /// carregada aqui. Quando não está (foi respondida uma mensagem antiga, ou
  /// apagada), o MessageItem mostra que a original não está mais à mão.
  const porId = new Map(messages.map((m) => [m.id, m]));

  let lastDay = "";

  return (
    <div
      ref={scroller}
      onScroll={onScroll}
      /*
        O @container é o que faz a conversa se medir pela COLUNA, não pela
        janela: a mesma lista mora no chat largo, no painel da voz (280px) e
        no fórum. Breakpoint de viewport erraria os três.
      */
      className="@container flex-1 overflow-y-auto pt-4"
    >
      {/*
        O recuo mora aqui dentro, no conteúdo, e não no `overflow`: é ele que
        o observador de tamanho mede.

        `--gc-rodape` é a altura da caixa de escrever, que fica por cima desta
        lista — sem esse recuo, a última mensagem nasceria escondida atrás
        dela. O valor de reserva atende quem usa a lista sem caixa nenhuma (a
        prévia de mensagens fixadas, por exemplo).
      */}
      <div ref={conteudo} className="pb-[var(--gc-rodape,1rem)]">
      {hasNextPage ? (
        <p className="py-3 text-center text-xs text-ink-faint">
          {isFetchingNextPage ? "Carregando…" : "Role para cima para ver mais"}
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
                <h2 className="text-2xl font-bold">Histórico indisponível</h2>
                <p className="mt-1 text-ink-muted">
                  Seu cargo não tem permissão para ler o histórico de #{channelName}. As mensagens
                  novas continuam aparecendo enquanto você estiver aqui.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold">Bem-vindo a #{channelName}</h2>
                <p className="mt-1 text-ink-muted">Este é o começo do canal #{channelName}.</p>
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
