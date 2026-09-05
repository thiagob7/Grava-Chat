import React from "react";
import { ArrowLeft, Lock, LockOpen } from "lucide-react";

import { useClosePost } from "~/@core/application/queries/forum/use-forum";
import type { ForumPostModel } from "~/@core/application/requests/forum/forum";
import {
  AreaDeConversa,
  PainelDaConversa,
  RodapeDaConversa,
} from "~/features/conversa/components/AreaDeConversa";
import { Composer } from "~/features/conversa/components/Composer";
import { MessageList } from "~/features/conversa/components/MessageList";
import { Button } from "~/components/ui/button";
import { formatTimestamp } from "~/lib/format";

interface ForumPostViewProps {
  post: ForumPostModel;
  guildId: string;
  currentUserId: string | undefined;
  isModerator: boolean;
  podeEscrever: boolean;
  onVoltar: () => void;
}

export const ForumPostView: React.FC<ForumPostViewProps> = ({
  post,
  guildId,
  currentUserId,
  isModerator,
  podeEscrever,
  onVoltar,
}) => {
  const fechar = useClosePost(post.channelId);
  const podeFechar = isModerator || post.author.id === currentUserId;

  return (
    <>
      <header data-gc="conversa.forum-post-view.header" className="flex h-12 shrink-0 items-center gap-3 border-b border-divisor px-4 shadow-sm">
        <button data-gc="conversa.forum-post-view.button.on-voltar"
          onClick={onVoltar}
          className="flex items-center gap-1.5 text-sm text-ink-muted transition hover:text-ink"
        >
          <ArrowLeft data-gc="conversa.forum-post-view.arrow-left" size={16} /> Assuntos
        </button>

        <span data-gc="conversa.forum-post-view.span" className="h-5 w-px bg-line" />

        <h2 data-gc="conversa.forum-post-view.h2" className="min-w-0 flex-1 truncate font-semibold">{post.title}</h2>

        {post.closedAt && (
          <span data-gc="conversa.forum-post-view.span--2" className="flex items-center gap-1 rounded bg-surface-0 px-2 py-0.5 text-11 uppercase text-ink-faint">
            <Lock data-gc="conversa.forum-post-view.lock" size={11} /> fechado
          </span>
        )}

        {podeFechar && (
          <Button data-gc="conversa.forum-post-view.button"
            variant="ghost"
            size="sm"
            onClick={() => fechar.mutate({ postId: post.id, closed: !post.closedAt })}
          >
            {post.closedAt ? <LockOpen data-gc="conversa.forum-post-view.lock-open" size={14} /> : <Lock data-gc="conversa.forum-post-view.lock--2" size={14} />}
            {post.closedAt ? "Reabrir" : "Fechar"}
          </Button>
        )}
      </header>

      <AreaDeConversa data-gc="conversa.forum-post-view.area-de-conversa">
        <PainelDaConversa data-gc="conversa.forum-post-view.painel-da-conversa">
        <MessageList data-gc="conversa.forum-post-view.message-list"
          channelId={post.channelId}
          channelName={post.title}
          postId={post.id}
          guildId={guildId}
          currentUserId={currentUserId}
          isModerator={isModerator}
          header={
            <div data-gc="conversa.forum-post-view.div" className="px-4 pb-4 pt-6">
              <h3 data-gc="conversa.forum-post-view.h3" className="text-2xl font-bold">{post.title}</h3>
              <p data-gc="conversa.forum-post-view.p" className="mt-1 text-sm text-ink-muted">
                Assunto criado por {post.author.displayName} em {formatTimestamp(post.createdAt)}.
              </p>
            </div>
          }
        />

        </PainelDaConversa>

      <RodapeDaConversa data-gc="conversa.forum-post-view.rodape-da-conversa">
        {post.closedAt ? (
          <p data-gc="conversa.forum-post-view.p--2" className="px-4 pb-6 text-center text-sm text-ink-faint">
            Este assunto está fechado. Reabra para continuar a conversa.
          </p>
        ) : (
          <Composer data-gc="conversa.forum-post-view.composer"
            channelId={post.channelId}
            channelName={post.title}
            guildId={guildId}
            postId={post.id}
            podeEscrever={podeEscrever}
          />
        )}
      </RodapeDaConversa>
      </AreaDeConversa>
    </>
  );
};
