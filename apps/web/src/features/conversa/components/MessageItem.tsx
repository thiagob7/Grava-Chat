import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import { useFindGuild } from "~/@core/application/queries/guild/use-find-guild";
import {
  Bookmark,
  Copy,
  CornerUpLeft,
  Flag,
  Hash,
  Link2,
  MailOpen,
  MoreHorizontal,
  Forward,
  Pencil,
  Pin,
  PinOff,
  RotateCw,
  SlashSquare,
  SmilePlus,
  Sparkles,
  Trash2,
  TriangleAlert,
  UserPlus,
} from "lucide-react";
import type { Attachment, GuildEmoji, Message, PublicUser } from "@gravae/shared";

import { Emoji } from "~/features/expressao/components/Emoji";
import { recentEmojis } from "~/features/expressao/lib/emoji";
import type { PendingMessageModel } from "~/@core/domain/models/message-model";
import type { PersonCharms } from "~/features/perfil/hooks/use-enfeites";
import type { ResolveMentions } from "~/features/conversa/hooks/use-mencoes";
import {
  deleteMessage,
  editMessage,
  reactToMessage,
} from "~/@core/lib/websocket/emit-message-actions";
import { Avatar } from "~/features/perfil/components/Avatar";
import { MessageAttachments } from "~/features/conversa/components/MessageAttachments";
import { removeAttachment } from "~/@core/application/requests/message/remover-anexo";
import { useMe } from "~/@core/application/queries/auth/use-me";
import { MessageContent } from "~/features/conversa/components/MessageContent";
import { LinkEmbeds } from "~/features/conversa/components/LinkEmbed";
import { Tooltip } from "~/components/ui/tooltip";
import { useWhoReacted } from "~/@core/application/queries/message/use-quem-reagiu";
import { PollCard } from "~/features/conversa/components/PollCard";
import { ServerTag } from "~/features/perfil/components/ServerTag";
import { UserName } from "~/features/perfil/components/UserName";
import { UserProfilePopover } from "~/features/perfil/components/UserProfilePopover";
import { formatTime, formatTimestamp } from "~/lib/format";
import { loadFont, fontFamily } from "~/features/perfil/lib/fontes";
import { cn } from "~/lib/utils";
import { useEditStore } from "~/features/conversa/stores/edicao-store";
import { useConfirm } from "~/components/ui/confirm";
import { Textarea } from "~/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  useFavoriteMessageIds,
  useToggleFavoriteMessage,
} from "~/@core/application/queries/message/use-message-favorites";
import { unreadFromMessage } from "~/@core/lib/websocket/emit-message-actions";
import { copyText } from "~/lib/copiar";
import { useShiftPressed } from "~/hooks/use-shift";
import { useHold } from "~/hooks/use-segurar";
import { useReplyStore } from "~/features/conversa/stores/reply-store";
import { useSuperReaction } from "~/features/expressao/stores/super-reacao";
import { ExpressionPicker } from "~/features/expressao/components/ExpressionPicker";
import { ReportMessage } from "~/features/conversa/components/DenunciarMensagem";
import { failureKey, newCanTry } from "~/features/conversa/lib/falha-de-envio";
import { ForwardModal } from "~/features/conversa/components/EncaminharModal";
import { useIgnoreStore } from "~/stores/ignore-store";
import { useAppearance } from "~/features/configuracoes/stores/aparencia";
import { useTranslation } from "~/traducao";
import { flx, flxAttr, flxCls } from "~/lib/compat-de-tema";

const DEFAULT_QUICK = ["👍", "🔥", "😂", "❤️"];

function reactionShortcuts(): string[] {
  const used = recentEmojis().filter((e) => e.length <= 8);

  return [...new Set([...used, ...DEFAULT_QUICK])].slice(0, 3);
}

const DEFAULT_SUPER = "🔥";

interface MessageItemProps {
  message: PendingMessageModel;
  compact: boolean;
  canDelete: boolean;
  canPin?: boolean;
  isOwn: boolean;
  currentUserId?: string;
  guildId?: string;
  replied?: PendingMessageModel;
  emojis?: GuildEmoji[];
  charms?: PersonCharms;
  mentions?: ResolveMentions;
  meMentions?: boolean;
  highlighted?: boolean;
  onRetry: (message: PendingMessageModel) => void;
  onPin?: (message: Message, pin: boolean) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  compact,
  canDelete,
  canPin = false,
  isOwn,
  currentUserId,
  guildId,
  replied,
  emojis = [],
  charms,
  mentions,
  meMentions = false,
  highlighted = false,
  onRetry,
  onPin,
}) => {
  const { t } = useTranslation();
  const confirm = useConfirm();

  const ignored = useIgnoreStore((s) => s.ignoredList).includes(message.author.id);
  useAppearance((s) => s.hourIn24h);

  const showAvatars = useAppearance((s) => s.avatars);
  const showReactions = useAppearance((s) => s.reactions);
  const shortcuts = React.useMemo(reactionShortcuts, []);
  const [revealed, setRevealed] = useState(false);

  const [editing, setEditing] = useState(false);

  const editRequest = useEditStore((s) => s.request);
  const collapseRequest = useEditStore((s) => s.collapse);

  useEffect(() => {
    if (editRequest !== message.id) return;

    setDraft(message.content);
    setEditing(true);
    collapseRequest();

    requestAnimationFrame(() => root.current?.scrollIntoView({ block: "center" }));
  }, [editRequest, message.id, message.content, collapseRequest]);
  const [draft, setDraft] = useState(message.content);

  useEffect(() => loadFont(message.font), [message.font]);
  const [reacting, setReacting] = useState(false);
  const [reactingLine, setReactingLine] = useState(false);
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [forwarding, setForwarding] = useState(false);
  const [reporting, setReporting] = useState(false);
  const canReport = !isOwn && !message.author.system;
  const root = useRef<HTMLDivElement>(null);

  const saveEdit = async () => {
    const content = draft.trim();
    if (!content || content === message.content) return setEditing(false);

    await editMessage({ messageId: message.id, content }).catch(() => undefined);
    setEditing(false);
  };

  const shift = useShiftPressed();
  const reply = useReplyStore((s) => s.reply);
  const favorites = useFavoriteMessageIds();
  const toggleFavorite = useToggleFavoriteMessage();
  const favorite = (favorites.data ?? []).includes(message.id);

  const urlDoEmoji = (emoji: string) => {
    const name = /^:([\w~-]+):$/.exec(emoji)?.[1];
    return name ? (emojis.find((e) => e.name === name)?.url ?? null) : null;
  };

  const toggleReaction = async (emoji: string) => {
    const mine = message.reactions.find((r) => r.emoji === emoji)?.me;
    await reactToMessage(message.id, emoji, !mine).catch(() => undefined);
    setReacting(false);
  };

  const superReact = (emoji: string) => {
    const box = root.current?.getBoundingClientRect();

    useSuperReaction
      .getState()
      .fire(
        emoji,
        box ? { x: box.left + box.width / 2, y: box.bottom } : undefined,
        urlDoEmoji(emoji),
      );

    void reactToMessage(message.id, emoji, true, true).catch(() => undefined);
    setReacting(false);
  };

  const copy = (text: string, notice: string) => {
    void copyText(text).then((gave) =>
      gave ? toast.success(notice) : toast.error(t("conversa.mensagem.naoDeuParaCopiar")),
    );
  };

  const messageLink = () =>
    `${window.location.origin}/channels/${guildId ?? "@me"}/${message.channelId}/${message.id}`;

  const markNotRead = () => {
    unreadFromMessage(message.channelId, message.id);
    toast.success(t("conversa.mensagem.naoLidasDaqui"));
  };

  const deleteSame = () => void deleteMessage(message.id).catch(() => undefined);

  const deleteAttachment = (attachment: Attachment) =>
    void confirm({
      title: t("conversa.anexos.excluirTitulo"),
      description: t("conversa.anexos.excluirDescricao", { arquivo: attachment.filename }),
      action: t("conversa.anexos.excluirAcao"),
      destructive: true,
    }).then(({ confirmed }) => {
      if (!confirmed) return;

      void removeAttachment(message.id, attachment.id).catch(() =>
        toast.error(t("conversa.anexos.excluirFalhou")),
      );
    });

  const doDelete = () => {
    if (shift) return deleteSame();

    void confirm({
      title: t("conversa.mensagem.apagarTitulo"),
      description: (
        <>
          {t("conversa.mensagem.apagarDescricao")}
          <MessagePreview data-gc="conversa.message-item.message-preview" message={message} emojis={emojis} />
        </>
      ),
      action: t("conversa.mensagem.apagarAcao"),
      destructive: true,
      shiftHint: true,
    }).then(({ confirmed }) => confirmed && deleteSame());
  };

  const startReply = () =>
    reply({
      messageId: message.id,
      channelId: message.channelId,
      author: message.author.displayName,
      authorId: message.author.id,
    });

  if (message.kind === "COMANDO") {
    return (
      <div data-gc="conversa.message-item.div" className="group flex items-center gap-2 px-2 py-1 text-sm text-ink-muted transition hover:bg-hover @sm:gap-3 @sm:px-4">
        <SlashSquare data-gc="conversa.message-item.slash-square" size={16} className="shrink-0 text-ink-faint" />
        <span data-gc="conversa.message-item.span" className="max-w-[8rem] truncate font-medium text-ink @sm:max-w-none">
          {message.author.displayName}
        </span>
        <span data-gc="conversa.message-item.span--2" className="hidden @xs:inline">{t("conversa.mensagem.usou")}</span>
        <span data-gc="conversa.message-item.span--3" className="min-w-0 truncate text-xs text-ink-muted">
          <MessageContent data-gc="conversa.message-item.message-content" content={message.content} emojis={emojis} mentions={mentions} />
        </span>
        <span data-gc="conversa.message-item.span--4" className="shrink-0 text-xs text-ink-faint">{formatTime(message.createdAt)}</span>

        {canDelete && (
          <button data-gc="conversa.message-item.button.do-delete"
            type="button"
            onClick={doDelete}
            title={t("conversa.acoes.apagar")}
            aria-label={t("conversa.acoes.apagar")}
            className="shrink-0 rounded p-1 text-ink-faint opacity-0 transition hover:bg-surface-3 hover:text-danger group-hover:opacity-100"
          >
            <Trash2 data-gc="conversa.message-item.trash2" size={14} />
          </button>
        )}
      </div>
    );
  }

  if (message.kind === "JOIN") {
    return (
      <div data-gc="conversa.message-item.div--2" className="my-2 flex items-center gap-2 px-2 py-1 text-sm text-ink-muted @sm:gap-3 @sm:px-4">
        <UserPlus data-gc="conversa.message-item.user-plus" size={16} className="shrink-0 text-online" />
        <span data-gc="conversa.message-item.span--5" className="shrink-0 font-medium text-ink">{message.author.displayName}</span>
        <span data-gc="conversa.message-item.span--6" className="min-w-0 truncate">{message.content.replace(/<@[a-f\d]{24}>/gi, "").trim()}</span>
        <span data-gc="conversa.message-item.span--7" className="shrink-0 text-xs text-ink-faint">{formatTime(message.createdAt)}</span>
      </div>
    );
  }

  return (
    <div data-gc="conversa.message-item.div--3"
      ref={root}
      data-mensagem={message.id}
      {...flxAttr("messagesGroup")}
      className={cn(
        "group relative flex flex-wrap gap-x-2 px-2 py-0.5 leading-[var(--message-line-height)] transition hover:bg-hover @sm:gap-x-[var(--message-gutter)] @sm:px-4",
        flxCls("messageFrame"),
        !message.content && flxCls("messageWithoutText"),
        !compact && "mt-4",
        meMentions &&
          cn(
            "bg-destaque-fundo shadow-[inset_2px_0_0_var(--color-destaque)] hover:bg-destaque/15",
            flxCls("messageMentions"),
          ),
        highlighted && "bg-brand/15 shadow-[inset_2px_0_0_var(--color-brand)]",
        message.pending && "opacity-60",
        message.failed && "bg-danger-fundo",
      )}
    >
      {message.forwarded && (
        <Forwarded data-gc="conversa.message-item.forwarded"
          origin={message.forwarded}
          guildId={guildId}
        />
      )}

      {message.replyToId && (
        <Quote data-gc="conversa.message-item.quote"
          replyToId={message.replyToId}
          replied={replied}
          emojis={emojis}
          mentions={mentions}
          currentUserId={currentUserId}
        />
      )}

      <div data-gc="conversa.message-item.div--4" {...flx("messageGutter", "w-10 shrink-0")}>
        {compact || !showAvatars ? (
          <span data-gc="conversa.message-item.span--8" {...flx("hourPassMouse", "hidden text-11 leading-6 text-ink-muted group-hover:block")}>
            {formatTime(message.createdAt)}
          </span>
        ) : (
          <UserProfilePopover data-gc="conversa.message-item.user-profile-popover" userId={message.author.id}>
            <button data-gc="conversa.message-item.button" className="rounded-full transition hover:brightness-110">
              <Avatar data-gc="conversa.message-item.avatar"
                id={message.author.id}
                name={message.author.displayName}
                url={message.author.avatarUrl}
                charms={charms?.profile}
                className={flxCls("messageAvatar")}
              />
            </button>
          </UserProfilePopover>
        )}
      </div>

      <div data-gc="conversa.message-item.div--5" {...flx("messageColumn", "min-w-0 flex-1")}>
        {!compact && (
          <div data-gc="conversa.message-item.div--6" {...flx("authorLine", "flex items-baseline gap-x-2")}>
            <UserProfilePopover data-gc="conversa.message-item.user-profile-popover--2" userId={message.author.id}>
              <button data-gc="conversa.message-item.button--2" {...flx("authorName", "min-w-0 max-w-full truncate font-medium text-ink hover:underline")}>
                <UserName data-gc="conversa.message-item.user-name"
                  name={message.author.displayName}
                  profile={charms?.profile}
                  roleColor={charms?.roleColor}
                  isBot={message.author.isBot}
                  isSystem={message.author.system}
                />
              </button>
            </UserProfilePopover>
            <ServerTag data-gc="conversa.message-item.server-tag" tag={charms?.profile?.serverTag} />
            <span data-gc="conversa.message-item.span--9" {...flx("messageHour", "shrink-0 text-xs text-ink-muted")} title={formatTimestamp(message.createdAt)}>
              <span data-gc="conversa.message-item.span--10" className="@md:hidden">{formatTime(message.createdAt)}</span>
              <span data-gc="conversa.message-item.span--11" className="hidden @md:inline">{formatTimestamp(message.createdAt)}</span>
            </span>
            {message.pinnedAt && (
              <span data-gc="conversa.message-item.span--12" className="flex shrink-0 items-center gap-1 text-10 text-ink-faint">
                <Pin data-gc="conversa.message-item.pin" size={10} /> {t("conversa.mensagem.fixada")}
              </span>
            )}
          </div>
        )}

        {ignored && !revealed ? (
          <p data-gc="conversa.message-item.p" className="my-1 flex items-center gap-2 text-sm italic text-ink-faint">
            {t("conversa.mensagem.ignorada")}
            <button data-gc="conversa.message-item.button--3" onClick={() => setRevealed(true)} className="not-italic text-brand hover:underline">
              {t("conversa.mensagem.mostrar")}
            </button>
          </p>
        ) : editing ? (
          <div data-gc="conversa.message-item.div--7" className="my-1">
            <Textarea data-gc="conversa.message-item.textarea"
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
              rows={Math.min(6, draft.split("\n").length)}
            />
            <p data-gc="conversa.message-item.p--2" className="mt-1 text-xs text-ink-faint">
              {t("conversa.mensagem.escPara")}{" "}
              <button data-gc="conversa.message-item.button--4" onClick={() => setEditing(false)} className="text-brand hover:underline">
                {t("conversa.mensagem.cancelar")}
              </button>{" "}
              · {t("conversa.mensagem.enterParaSalvar")}
            </p>
          </div>
        ) : (
          message.content && (
            <div data-gc="conversa.message-item.div--8"
              className={cn("whitespace-pre-wrap break-words text-ink", flxCls("messageBody"), flxCls("messageText"))}
              style={{ fontFamily: fontFamily(message.font) ?? undefined }}
            >
              <MessageContent data-gc="conversa.message-item.message-content--2" content={message.content} emojis={emojis} mentions={mentions} blocks />
              {message.editedAt && (
                <span data-gc="conversa.message-item.span--13" {...flx("editedLabel", "ml-1 text-10 text-ink-faint")}>
                  {t("conversa.mensagem.editado")}
                </span>
              )}
            </div>
          )
        )}

        {!editing && !(ignored && !revealed) && message.content && (
          <LinkEmbeds data-gc="conversa.message-item.link-embeds" content={message.content} />
        )}

        {message.sticker && (
          <img data-gc="conversa.message-item.img"
            src={message.sticker.url}
            alt={message.sticker.name}
            title={message.sticker.name}
            className="mt-1 size-40 max-w-full object-contain"
          />
        )}

        {message.poll && (
          <PollCard data-gc="conversa.message-item.poll-card"
            messageId={message.id}
            poll={message.poll}
            currentUserId={currentUserId}
            isAuthor={isOwn}
          />
        )}

        <MessageAttachments data-gc="conversa.message-item.message-attachments"
          attachments={message.attachments}
          onRemove={canDelete ? deleteAttachment : undefined}
        />

        {message.failed && (
          <div data-gc="conversa.message-item.div--9" className="mt-1 flex flex-wrap items-center gap-1 text-xs text-danger">
            <TriangleAlert data-gc="conversa.message-item.triangle-alert" size={12} />
            <span data-gc="conversa.message-item.span--14">{t(failureKey(message.reason))}</span>

            {newCanTry(message.reason) && (
              <button data-gc="conversa.message-item.button--5" onClick={() => onRetry(message)} className="flex items-center gap-1 hover:underline">
                <RotateCw data-gc="conversa.message-item.rotate-cw" size={12} /> {t("conversa.falha.tentarDeNovo")}
              </button>
            )}
          </div>
        )}

        {showReactions && message.reactions.length > 0 && (
          <div data-gc="conversa.message-item.div--10" className="mt-1 flex flex-wrap items-center gap-1">
            {message.reactions.map((reaction) => (
              <ReactionPill data-gc="conversa.message-item.reaction-pill"
                key={reaction.emoji}
                reaction={reaction}
                messageId={message.id}
                emojis={emojis}
                onReact={() => void toggleReaction(reaction.emoji)}
                onSuper={() => superReact(reaction.emoji)}
              />
            ))}

            <Popover data-gc="conversa.message-item.popover.set-reacting-line" open={reactingLine} onOpenChange={setReactingLine}>
              <PopoverTrigger data-gc="conversa.message-item.popover-trigger" asChild>
                <button data-gc="conversa.message-item.button--6"
                  type="button"
                  aria-label={t("conversa.acoes.reagir")}
                  title={t("conversa.acoes.reagir")}
                  className={cn(
                    flxCls("reactionButton"),
                    "flex shrink-0 items-center rounded border border-transparent px-1.5 py-[3px] text-ink-faint transition hover:bg-hover hover:text-ink",
                  )}
                >
                  <SmilePlus data-gc="conversa.message-item.smile-plus" size={16} />
                </button>
              </PopoverTrigger>

              <PopoverContent data-gc="conversa.message-item.popover-content" side="top" align="start" className="w-auto border-0 bg-transparent p-0">
                <ExpressionPicker data-gc="conversa.message-item.expression-picker"
                  guildId={guildId}
                  mode="reacao"
                  onClose={() => setReactingLine(false)}
                  onEmoji={(text) => void toggleReaction(text)}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {!message.pending && !message.failed && !editing && (
        <div data-gc="conversa.message-item.div--11"
          className={cn(
            "barra-da-mensagem absolute -top-3 right-2 z-10 max-w-[calc(100%-1rem)] items-center gap-0.5 rounded border border-line bg-surface-1 p-0.5 shadow-lg @sm:right-4",
            flxCls("messageBar"),
            "group-hover:flex group-focus-within:flex",
            reacting || menuIsOpen ? "flex" : "hidden",
          )}
        >
          {showReactions &&
            shortcuts.map((emoji) => (
              <ReactionShortcut data-gc="conversa.message-item.reaction-shortcut"
                key={emoji}
                emoji={emoji}
                onReact={() => void toggleReaction(emoji)}
                onSuper={() => superReact(emoji)}
              />
            ))}

          {showReactions && (
          <Popover data-gc="conversa.message-item.popover.set-reacting" open={reacting} onOpenChange={setReacting}>
            <PopoverTrigger data-gc="conversa.message-item.popover-trigger--2" asChild>
              <BarAction data-gc="conversa.message-item.bar-action" title={t("conversa.acoes.reagir")}>
                <SmilePlus data-gc="conversa.message-item.smile-plus--2" size={14} />
              </BarAction>
            </PopoverTrigger>

            <PopoverContent data-gc="conversa.message-item.popover-content--2" side="top" align="end" className="w-auto border-0 bg-transparent p-0">
              <ExpressionPicker data-gc="conversa.message-item.expression-picker--2"
                guildId={guildId}
                mode="reacao"
                onClose={() => setReacting(false)}
                onEmoji={(text) => void toggleReaction(text)}
              />
            </PopoverContent>
          </Popover>
          )}

          <BarAction data-gc="conversa.message-item.bar-action.start-reply" title={t("conversa.acoes.responder")} onClick={startReply}>
            <CornerUpLeft data-gc="conversa.message-item.corner-up-left" size={14} />
          </BarAction>

          <BarAction data-gc="conversa.message-item.bar-action--2" title={t("conversa.acoes.encaminhar")} onClick={() => setForwarding(true)}>
            <Forward data-gc="conversa.message-item.forward" size={14} />
          </BarAction>

          {shift && (
            <>
              <BarAction data-gc="conversa.message-item.bar-action--3"
                title={t(favorite ? "conversa.acoes.tirarDosFavoritos" : "conversa.acoes.favoritar")}
                onClick={() => toggleFavorite.mutate({ messageId: message.id, favorite })}
              >
                <Bookmark data-gc="conversa.message-item.bookmark" size={14} className={favorite ? "fill-current text-brand" : undefined} />
              </BarAction>

              {canPin && (
                <BarAction data-gc="conversa.message-item.bar-action--4"
                  title={t(message.pinnedAt ? "conversa.acoes.desafixarMensagem" : "conversa.acoes.fixarMensagem")}
                  onClick={() => onPin?.(message, !message.pinnedAt)}
                >
                  {message.pinnedAt ? <PinOff data-gc="conversa.message-item.pin-off" size={14} /> : <Pin data-gc="conversa.message-item.pin--2" size={14} />}
                </BarAction>
              )}

              {isOwn && (
                <BarAction data-gc="conversa.message-item.bar-action--5"
                  title={t("conversa.acoes.editarMensagem")}
                  onClick={() => {
                    setDraft(message.content);
                    setEditing(true);
                  }}
                >
                  <Pencil data-gc="conversa.message-item.pencil" size={14} />
                </BarAction>
              )}

              <BarAction data-gc="conversa.message-item.bar-action.mark-not-read" title={t("conversa.acoes.marcarNaoLida")} onClick={markNotRead}>
                <MailOpen data-gc="conversa.message-item.mail-open" size={14} />
              </BarAction>

              <BarAction data-gc="conversa.message-item.bar-action--6"
                title={t("conversa.acoes.copiarLink")}
                onClick={() => copy(messageLink(), t("conversa.mensagem.linkCopiado"))}
              >
                <Link2 data-gc="conversa.message-item.link2" size={14} />
              </BarAction>

              {canReport && (
                <BarAction data-gc="conversa.message-item.bar-action--7" title={t("conversa.acoes.denunciarMensagem")} onClick={() => setReporting(true)}>
                  <Flag data-gc="conversa.message-item.flag" size={14} />
                </BarAction>
              )}

              {canDelete && (
                <BarAction data-gc="conversa.message-item.bar-action.do-delete" title={t("conversa.acoes.apagarMensagem")} onClick={doDelete}>
                  <Trash2 data-gc="conversa.message-item.trash2--2" size={14} className="text-danger" />
                </BarAction>
              )}
            </>
          )}

          <DropdownMenu data-gc="conversa.message-item.dropdown-menu.set-menu-is-open" open={menuIsOpen} onOpenChange={setMenuIsOpen}>
            <DropdownMenuTrigger data-gc="conversa.message-item.dropdown-menu-trigger" asChild>
              <BarAction data-gc="conversa.message-item.bar-action--8" title={t("conversa.acoes.mais")}>
                <MoreHorizontal data-gc="conversa.message-item.more-horizontal" size={14} />
              </BarAction>
            </DropdownMenuTrigger>

            <DropdownMenuContent data-gc="conversa.message-item.dropdown-menu-content" align="end" className="w-60">
              {showReactions && (
                <div data-gc="conversa.message-item.div--12" className="mb-1 flex items-center gap-0.5 border-b border-line px-1 pb-1.5">
                  {shortcuts.map((emoji) => (
                    <ReactionShortcut data-gc="conversa.message-item.reaction-shortcut--2"
                      key={emoji}
                      emoji={emoji}
                      onReact={() => {
                        setMenuIsOpen(false);
                        void toggleReaction(emoji);
                      }}
                      onSuper={() => {
                        setMenuIsOpen(false);
                        superReact(emoji);
                      }}
                    />
                  ))}

                  <BarAction data-gc="conversa.message-item.bar-action--9"
                    title={t("conversa.acoes.reagir")}
                    className="ml-auto"
                    onClick={() => {
                      setMenuIsOpen(false);
                      setReacting(true);
                    }}
                  >
                    <SmilePlus data-gc="conversa.message-item.smile-plus--3" size={16} />
                  </BarAction>
                </div>
              )}

              <DropdownMenuItem data-gc="conversa.message-item.dropdown-menu-item.start-reply" onSelect={startReply}>
                {t("conversa.acoes.responder")} <CornerUpLeft data-gc="conversa.message-item.corner-up-left--2" size={16} />
              </DropdownMenuItem>

              <DropdownMenuItem data-gc="conversa.message-item.dropdown-menu-item" onSelect={() => setForwarding(true)}>
                {t("conversa.acoes.encaminhar")} <Forward data-gc="conversa.message-item.forward--2" size={16} />
              </DropdownMenuItem>

              {showReactions && (
                <>
                  <DropdownMenuItem data-gc="conversa.message-item.dropdown-menu-item--2" onSelect={() => setReacting(true)}>
                    {t("conversa.acoes.adicionarReacao")} <SmilePlus data-gc="conversa.message-item.smile-plus--4" size={16} />
                  </DropdownMenuItem>

                  <DropdownMenuItem data-gc="conversa.message-item.dropdown-menu-item--3" onSelect={() => superReact(DEFAULT_SUPER)}>
                    {t("conversa.acoes.superReagirCom", { emoji: DEFAULT_SUPER })}{" "}
                    <Sparkles data-gc="conversa.message-item.sparkles" size={16} />
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator data-gc="conversa.message-item.dropdown-menu-separator" />

              {canPin && (
                <DropdownMenuItem data-gc="conversa.message-item.dropdown-menu-item--4" onSelect={() => onPin?.(message, !message.pinnedAt)}>
                  {t(
                    message.pinnedAt
                      ? "conversa.acoes.desafixarMensagem"
                      : "conversa.acoes.fixarMensagem",
                  )}
                  {message.pinnedAt ? <PinOff data-gc="conversa.message-item.pin-off--2" size={16} /> : <Pin data-gc="conversa.message-item.pin--3" size={16} />}
                </DropdownMenuItem>
              )}

              {isOwn && (
                <DropdownMenuItem data-gc="conversa.message-item.dropdown-menu-item--5"
                  onSelect={() => {
                    setDraft(message.content);
                    setEditing(true);
                  }}
                >
                  {t("conversa.acoes.editarMensagem")} <Pencil data-gc="conversa.message-item.pencil--2" size={16} />
                </DropdownMenuItem>
              )}

              <DropdownMenuItem data-gc="conversa.message-item.dropdown-menu-item--6"
                onSelect={() => toggleFavorite.mutate({ messageId: message.id, favorite })}
              >
                {t(favorite ? "conversa.acoes.tirarDosFavoritos" : "conversa.acoes.favoritar")}
                <Bookmark data-gc="conversa.message-item.bookmark--2" size={16} className={favorite ? "fill-current text-brand" : undefined} />
              </DropdownMenuItem>

              {canPin && (
                <DropdownMenuItem data-gc="conversa.message-item.dropdown-menu-item--7" onSelect={() => onPin?.(message, !message.pinnedAt)}>
                  {t(message.pinnedAt ? "conversa.acoes.desafixarMensagem" : "conversa.acoes.fixarMensagem")}
                  {message.pinnedAt ? <PinOff data-gc="conversa.message-item.pin-off--3" size={16} /> : <Pin data-gc="conversa.message-item.pin--4" size={16} />}
                </DropdownMenuItem>
              )}

              <DropdownMenuItem data-gc="conversa.message-item.dropdown-menu-item.mark-not-read" onSelect={markNotRead}>
                {t("conversa.acoes.marcarNaoLida")} <MailOpen data-gc="conversa.message-item.mail-open--2" size={16} />
              </DropdownMenuItem>

              <DropdownMenuSeparator data-gc="conversa.message-item.dropdown-menu-separator--2" />

              <DropdownMenuItem data-gc="conversa.message-item.dropdown-menu-item--8"
                onSelect={() => copy(messageLink(), t("conversa.mensagem.linkCopiado"))}
              >
                {t("conversa.acoes.copiarLink")} <Link2 data-gc="conversa.message-item.link2--2" size={16} />
              </DropdownMenuItem>

              <DropdownMenuItem data-gc="conversa.message-item.dropdown-menu-item--9"
                onSelect={() => copy(message.id, t("conversa.mensagem.idCopiado"))}
              >
                {t("conversa.acoes.copiarId")} <Copy data-gc="conversa.message-item.copy" size={16} />
              </DropdownMenuItem>

              {(canDelete || canReport) && (
                <DropdownMenuSeparator data-gc="conversa.message-item.dropdown-menu-separator--3" />
              )}

              {canDelete && (
                <DropdownMenuItem data-gc="conversa.message-item.dropdown-menu-item.do-delete" onSelect={doDelete} className="text-danger focus:text-danger">
                  {t("conversa.acoes.apagarMensagem")} <Trash2 data-gc="conversa.message-item.trash2--3" size={16} />
                </DropdownMenuItem>
              )}

              {canReport && (
                <DropdownMenuItem data-gc="conversa.message-item.dropdown-menu-item--10"
                  onSelect={() => setReporting(true)}
                  className="text-danger focus:text-danger"
                >
                  {t("conversa.acoes.denunciarMensagem")} <Flag data-gc="conversa.message-item.flag--2" size={16} />
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <ForwardModal data-gc="conversa.message-item.forward-modal"
        isOpen={forwarding}
        onClose={() => setForwarding(false)}
        message={message}
        guildId={guildId}
      />

      <ReportMessage data-gc="conversa.message-item.report-message" message={message} isOpen={reporting} onClose={() => setReporting(false)} />
    </div>
  );
};

export const shouldGroup = (prev: Message | undefined, current: Message) =>
  Boolean(
    prev &&
      prev.author.id === current.author.id &&
      new Date(current.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60_000,
  );

const ReactionEmoji: React.FC<{
  emoji: string;
  fromServer: GuildEmoji[];
  className?: string;
}> = ({ emoji, fromServer, className = "size-5" }) => {
  const name = /^:([\w~-]+):$/.exec(emoji)?.[1];
  const match = name ? fromServer.find((e) => e.name === name) : undefined;

  if (!match) return <Emoji data-gc="conversa.message-item.emoji" emoji={emoji} className={className} />;

  return <img data-gc="conversa.message-item.img--2" src={match.url} alt={emoji} className={cn(className, "object-contain")} />;
};

const BarAction = React.forwardRef<
  HTMLButtonElement,
  { title: string; className?: string; onClick?: () => void; children: React.ReactNode }
>(({ title, className, onClick, children, ...props }, ref) => (
  <button data-gc="conversa.message-item.button.on-click"
    ref={ref}
    onClick={onClick}
    title={title}
    aria-label={title}
    className={cn(
      "flex size-6 shrink-0 items-center justify-center rounded text-ink-muted transition hover:bg-surface-3 hover:text-ink",
      className,
    )}
    {...props}
  >
    {children}
  </button>
));
BarAction.displayName = "AcaoDaBarra";

const ReactionShortcut: React.FC<{
  emoji: string;
  className?: string;
  onReact: () => void;
  onSuper: () => void;
}> = ({ emoji, className, onReact, onSuper }) => {
  const { t } = useTranslation();

  return (
    <button data-gc="conversa.message-item.button--7"
      {...useHold(onReact, onSuper)}
      title={t("conversa.mensagem.reagirCom", { emoji })}
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded text-base leading-none transition hover:bg-surface-3",
        className,
      )}
    >
      <Emoji data-gc="conversa.message-item.emoji--2" emoji={emoji} className="size-4" />
    </button>
  );
};

const ReactionPill: React.FC<{
  reaction: Message["reactions"][number];
  emojis: GuildEmoji[];
  messageId: string;
  onReact: () => void;
  onSuper: () => void;
}> = ({ reaction, emojis, messageId, onReact, onSuper }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { data } = useWhoReacted(messageId, isOpen);

  const names = data?.find((group) => group.emoji === reaction.emoji)?.users ?? [];

  return (
    <Tooltip data-gc="conversa.message-item.tooltip.set-is-open"
      onOpenChange={setIsOpen}
      className="max-w-[18rem] px-3 py-4"
      label={
        <span data-gc="conversa.message-item.span--15" className="flex items-center gap-3 text-left">
          <ReactionEmoji data-gc="conversa.message-item.reaction-emoji"
            emoji={reaction.emoji}
            fromServer={emojis}
            className="size-12 shrink-0"
          />

          <span data-gc="conversa.message-item.span--16" className="flex min-w-0 flex-col gap-0.5">
            <span data-gc="conversa.message-item.span--17" className="text-sm font-semibold leading-tight text-ink">
              {whoReactedPhrase(t, reaction, names)}
            </span>
            <span data-gc="conversa.message-item.span--18" className="text-xs text-ink-muted">
              {t("conversa.reacao.dicaSuper")}
            </span>
          </span>
        </span>
      }
    >
      <button data-gc="conversa.message-item.button--8"
        {...flxAttr("reactionButton")}
        {...useHold(onReact, onSuper)}
        aria-label={t("conversa.mensagem.segureParaSuper", { emoji: reaction.emoji })}
        className={cn(
          "flex max-w-full shrink-0 items-center gap-1 rounded border px-2 py-0.5 text-sm transition",
          flxCls("reactionButton"),
          reaction.me ? "border-brand bg-brand/20" : "border-transparent bg-surface-3 hover:border-ink-faint",
          reaction.burst && "shadow-[0_0_0_1px_var(--color-idle),0_0_10px_-2px_var(--color-idle)]",
        )}
      >
        <ReactionEmoji data-gc="conversa.message-item.reaction-emoji--2" emoji={reaction.emoji} fromServer={emojis} />
        <span data-gc="conversa.message-item.span--19" className="text-xs font-medium text-ink-muted">{reaction.count}</span>
      </button>
    </Tooltip>
  );
};

function whoReactedPhrase(
  t: (key: string, values?: Record<string, unknown>) => string,
  reaction: Message["reactions"][number],
  names: PublicUser[],
): string {
  const emoji = reaction.emoji;

  if (!names.length) return t("conversa.reacao.carregando", { emoji });

  const list = names.map((who) => who.displayName);

  if (list.length === 1) return t("conversa.reacao.uma", { nome: list[0], emoji });
  if (list.length === 2)
    return t("conversa.reacao.duas", { primeiro: list[0], segundo: list[1], emoji });

  const shown = list.slice(0, 3);
  const remaining = reaction.count - shown.length;

  if (remaining <= 0)
    return t("conversa.reacao.duas", {
      primeiro: shown.slice(0, -1).join(", "),
      segundo: shown[shown.length - 1],
      emoji,
    });

  return t("conversa.reacao.varias", {
    nomes: shown.join(", "),
    quantos: remaining,
    emoji,
  });
}

const Quote: React.FC<{
  replied?: PendingMessageModel;
  replyToId?: string | null;
  emojis: GuildEmoji[];
  mentions?: ResolveMentions;
  currentUserId?: string;
}> = ({ replied, replyToId, emojis, mentions, currentUserId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const irForOriginal = () => {
    if (replyToId) navigate(`?m=${replyToId}`);
  };

  const me = useMe(true).data;
  const amEu = Boolean(currentUserId && replied?.author.id === currentUserId);
  const avatarUrl = amEu && me ? me.avatarUrl : replied?.author.avatarUrl;

  return (
  <div
    data-gc="conversa.message-item.div.ir-for-original"
    role={replyToId ? "button" : undefined}
    tabIndex={replyToId ? 0 : undefined}
    onClick={irForOriginal}
    onKeyDown={(e) => e.key === "Enter" && irForOriginal()}
    className={cn("mb-0.5 flex h-5 w-full items-center gap-1.5 overflow-hidden pl-5 text-xs", replyToId && "cursor-pointer [&:hover_.texto-da-citacao]:text-ink", flxCls("messagePreview"), flxCls("replied"))}
  >
    <span data-gc="conversa.message-item.span--20"
      aria-hidden
      className="-mb-0.5 h-4 w-5 shrink-0 self-end rounded-tl-lg border-l-2 border-t-2 border-line"
    />

    {replied ? (
      <>
        <UserProfilePopover data-gc="conversa.message-item.user-profile-popover--3" userId={replied.author.id}>
          <button data-gc="conversa.message-item.button--9" onClick={(e) => e.stopPropagation()} className="flex min-w-0 shrink-0 items-center gap-1.5 rounded transition hover:brightness-110">
            <Avatar data-gc="conversa.message-item.avatar--2"
              id={replied.author.id}
              name={replied.author.displayName}
              url={avatarUrl}
              size={16}
              className={flxCls("quoteAvatar")}
            />
            <span data-gc="conversa.message-item.span--21" {...flx("quoteName", "max-w-[7rem] truncate font-medium text-ink hover:underline @sm:max-w-[12rem]")}>
              @{replied.author.displayName}
            </span>
          </button>
        </UserProfilePopover>
        <span data-gc="conversa.message-item.span--22" {...flx("quoteText", "texto-da-citacao min-w-0 truncate text-ink-muted transition [&_img]:inline-block [&_img]:size-4 [&_img]:align-text-bottom")}>
          {replied.content ? (
            <MessageContent data-gc="conversa.message-item.message-content--3" content={replied.content} emojis={emojis} mentions={mentions} />
          ) : (
            t("conversa.mensagem.citacaoAnexo")
          )}
        </span>
      </>
    ) : (
      <span data-gc="conversa.message-item.span--23" className="italic text-ink-faint">{t("conversa.mensagem.citacaoSumiu")}</span>
    )}
    </div>
  );
};

const Forwarded: React.FC<{
  origin: { channelId: string; messageId: string };
  guildId?: string;
}> = ({ origin, guildId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: guild } = useFindGuild(guildId);
  const channel = guild?.channels.find((c) => c.id === origin.channelId);

  return (
    <div data-gc="conversa.message-item.div--13" className={cn(flxCls("forwardedBox"), "mb-0.5 flex w-full items-center pl-5")}>
      <button data-gc="conversa.message-item.button--10"
        type="button"
        onClick={() =>
          navigate(
            guildId
              ? `/channels/${guildId}/${origin.channelId}?m=${origin.messageId}`
              : `/channels/@me/${origin.channelId}?m=${origin.messageId}`,
          )
        }
        title={t("conversa.mensagem.irParaOriginal")}
        {...flx(
          "originButton",
          "flex items-center gap-1.5 rounded border border-line bg-surface-1 px-1.5 py-0.5 text-xs text-ink-muted transition hover:bg-surface-3 hover:text-ink",
        )}
      >
        <Forward data-gc="conversa.message-item.forward--3" size={12} />
        <span data-gc="conversa.message-item.span--24" className={flxCls("originLabel")}>{t("conversa.mensagem.encaminhadaDe")}</span>
        <span data-gc="conversa.message-item.span--25" className={cn(flxCls("originName"), "font-medium text-ink")}>
          {channel ? `#${channel.name}` : "…"}
        </span>
      </button>
    </div>
  );
};

const MessagePreview: React.FC<{
  message: Message | PendingMessageModel;
  emojis: GuildEmoji[];
}> = ({ message, emojis }) => (
  <div data-gc="conversa.message-item.div--14" className="mt-3 max-h-56 overflow-y-auto rounded-lg border border-line bg-surface-2 p-3">
    <div data-gc="conversa.message-item.div--15" className="flex items-baseline gap-2">
      <Avatar data-gc="conversa.message-item.avatar--3"
        id={message.author.id}
        name={message.author.displayName}
        url={message.author.avatarUrl}
        size={20}
      />
      <span data-gc="conversa.message-item.span--26" className="truncate text-sm font-medium">{message.author.displayName}</span>
      <span data-gc="conversa.message-item.span--27" className="shrink-0 text-xs text-ink-faint">
        {formatTimestamp(message.createdAt)}
      </span>
    </div>

    <div data-gc="conversa.message-item.div--16" className="mt-1 break-words text-sm text-ink-muted">
      {message.content ? (
        <MessageContent data-gc="conversa.message-item.message-content--4" content={message.content} emojis={emojis} blocks />
      ) : (
        <span data-gc="conversa.message-item.span--28" className="italic text-ink-faint">sem text</span>
      )}
    </div>
  </div>
);
