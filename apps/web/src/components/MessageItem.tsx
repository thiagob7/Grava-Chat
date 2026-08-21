import React, { useState } from "react";
import { Pencil, Pin, PinOff, RotateCw, SmilePlus, Trash2, UserPlus } from "lucide-react";
import type { GuildEmoji, Message } from "@gravae/shared";

import type { PendingMessageModel } from "~/@core/domain/models/message-model";
import {
  deleteMessage,
  editMessage,
  reactToMessage,
} from "~/@core/lib/websocket/emit-message-actions";
import { Avatar } from "~/components/Avatar";
import { MessageAttachments } from "~/components/MessageAttachments";
import { MessageContent } from "~/components/MessageContent";
import { PollCard } from "~/components/PollCard";
import { ServerTag } from "~/components/ServerTag";
import { UserProfilePopover } from "~/components/UserProfilePopover";
import { formatTime, formatTimestamp } from "~/lib/format";
import { cn } from "~/lib/utils";

const QUICK_EMOJIS = ["👍", "🔥", "😂", "❤️", "👀"];

interface MessageItemProps {
  message: PendingMessageModel;
  /** true quando é do mesmo autor em sequência: esconde avatar e nome */
  compact: boolean;
  canDelete: boolean;
  canPin?: boolean;
  isOwn: boolean;
  currentUserId?: string;
  /** emojis do servidor, para `:nome:` virar imagem */
  emojis?: GuildEmoji[];
  /** etiqueta do servidor ao lado do nome */
  tag?: string | null;
  tagIcon?: string | null;
  onRetry: (message: PendingMessageModel) => void;
  onPin?: (message: Message, fixar: boolean) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  compact,
  canDelete,
  canPin = false,
  isOwn,
  currentUserId,
  emojis = [],
  tag,
  tagIcon,
  onRetry,
  onPin,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const [showEmojis, setShowEmojis] = useState(false);

  const saveEdit = async () => {
    const content = draft.trim();
    if (!content || content === message.content) return setEditing(false);

    await editMessage({ messageId: message.id, content }).catch(() => undefined);
    setEditing(false);
  };

  const toggleReaction = async (emoji: string) => {
    const mine = message.reactions.find((r) => r.emoji === emoji)?.me;
    await reactToMessage(message.id, emoji, !mine).catch(() => undefined);
    setShowEmojis(false);
  };

  /**
   * Mensagem do sistema (alguém entrou) é um aviso, não uma fala: sem avatar
   * grande, sem ações e com o texto em uma linha só.
   */
  if (message.tipo === "JOIN") {
    return (
      <div className="flex items-center gap-3 px-4 py-1 text-sm text-ink-muted">
        <UserPlus size={16} className="shrink-0 text-online" />
        <span className="font-medium text-ink">{message.author.displayName}</span>
        <span>{message.content.replace(/<@[a-f\d]{24}>/gi, "").trim()}</span>
        <span className="text-xs text-ink-faint">{formatTime(message.createdAt)}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative flex gap-4 px-4 py-0.5 transition hover:bg-black/10",
        !compact && "mt-4",
        message.pending && "opacity-60",
        message.failed && "bg-danger/10",
      )}
    >
      <div className="w-10 shrink-0">
        {compact ? (
          <span className="hidden text-[10px] leading-6 text-ink-faint group-hover:block">
            {formatTime(message.createdAt)}
          </span>
        ) : (
          <UserProfilePopover userId={message.author.id}>
            <button className="rounded-full transition hover:brightness-110">
              <Avatar
                id={message.author.id}
                name={message.author.displayName}
                url={message.author.avatarUrl}
              />
            </button>
          </UserProfilePopover>
        )}
      </div>

      <div className="min-w-0 flex-1">
        {!compact && (
          <div className="flex items-baseline gap-2">
            <UserProfilePopover userId={message.author.id}>
              <button className="font-medium text-ink hover:underline">
                {message.author.displayName}
              </button>
            </UserProfilePopover>
            <ServerTag tag={tag} icone={tagIcon} />
            <span className="text-xs text-ink-faint">{formatTimestamp(message.createdAt)}</span>
            {message.pinnedAt && (
              <span className="flex items-center gap-1 text-[10px] text-ink-faint">
                <Pin size={10} /> fixada
              </span>
            )}
          </div>
        )}

        {editing ? (
          <div className="my-1">
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void saveEdit();
                }
                if (e.key === "Escape") setEditing(false);
              }}
              className="w-full resize-none rounded bg-surface-3 px-3 py-2 text-sm outline-none"
              rows={Math.min(6, draft.split("\n").length)}
            />
            <p className="mt-1 text-xs text-ink-faint">
              Esc para{" "}
              <button onClick={() => setEditing(false)} className="text-brand hover:underline">
                cancelar
              </button>{" "}
              · Enter para salvar
            </p>
          </div>
        ) : (
          message.content && (
            <p className="whitespace-pre-wrap break-words text-ink-muted">
              <MessageContent content={message.content} emojis={emojis} />
              {message.editedAt && <span className="ml-1 text-[10px] text-ink-faint">(editado)</span>}
            </p>
          )
        )}

        {message.sticker && (
          <img
            src={message.sticker.url}
            alt={message.sticker.name}
            title={message.sticker.name}
            className="mt-1 size-40 object-contain"
          />
        )}

        {message.poll && (
          <PollCard
            messageId={message.id}
            poll={message.poll}
            currentUserId={currentUserId}
            isAuthor={isOwn}
          />
        )}

        <MessageAttachments attachments={message.attachments} />

        {message.failed && (
          <button
            onClick={() => onRetry(message)}
            className="mt-1 flex items-center gap-1 text-xs text-danger hover:underline"
          >
            <RotateCw size={12} /> Não foi enviada. Tentar de novo
          </button>
        )}

        {message.reactions.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {message.reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                onClick={() => void toggleReaction(reaction.emoji)}
                className={cn(
                  "flex items-center gap-1 rounded border px-2 py-0.5 text-sm transition",
                  reaction.me
                    ? "border-brand bg-brand/20"
                    : "border-transparent bg-surface-3 hover:border-ink-faint",
                )}
              >
                <span>{reaction.emoji}</span>
                <span className="text-xs font-medium text-ink-muted">{reaction.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {!message.pending && !message.failed && !editing && (
        <div className="absolute -top-3 right-4 hidden items-center gap-0.5 rounded border border-line bg-surface-1 p-0.5 shadow-lg group-hover:flex">
          {showEmojis &&
            QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => void toggleReaction(emoji)}
                className="rounded px-1.5 py-1 text-base hover:bg-surface-3"
              >
                {emoji}
              </button>
            ))}

          <button
            onClick={() => setShowEmojis((v) => !v)}
            title="Reagir"
            className="rounded p-1.5 text-ink-muted transition hover:bg-surface-3 hover:text-ink"
          >
            <SmilePlus size={16} />
          </button>

          {canPin && (
            <button
              onClick={() => onPin?.(message, !message.pinnedAt)}
              title={message.pinnedAt ? "Desafixar" : "Fixar mensagem"}
              className="rounded p-1.5 text-ink-muted transition hover:bg-surface-3 hover:text-ink"
            >
              {message.pinnedAt ? <PinOff size={16} /> : <Pin size={16} />}
            </button>
          )}

          {isOwn && (
            <button
              onClick={() => {
                setDraft(message.content);
                setEditing(true);
              }}
              title="Editar"
              className="rounded p-1.5 text-ink-muted transition hover:bg-surface-3 hover:text-ink"
            >
              <Pencil size={16} />
            </button>
          )}

          {canDelete && (
            <button
              onClick={() => void deleteMessage(message.id).catch(() => undefined)}
              title="Apagar"
              className="rounded p-1.5 text-ink-muted transition hover:bg-surface-3 hover:text-danger"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const shouldGroup = (prev: Message | undefined, current: Message) =>
  Boolean(
    prev &&
      prev.author.id === current.author.id &&
      // mesma "rajada": até 5 minutos entre mensagens do mesmo autor
      new Date(current.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60_000,
  );
