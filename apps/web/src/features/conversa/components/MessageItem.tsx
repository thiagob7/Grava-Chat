import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  Bookmark,
  Copy,
  CornerUpLeft,
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
  UserPlus,
} from "lucide-react";
import type { GuildEmoji, Message } from "@gravae/shared";

import { Emoji } from "~/features/expressao/components/Emoji";
import type { PendingMessageModel } from "~/@core/domain/models/message-model";
import type { EnfeitesDaPessoa } from "~/features/perfil/hooks/use-enfeites";
import type { ResolverMencoes } from "~/features/conversa/hooks/use-mencoes";
import {
  deleteMessage,
  editMessage,
  reactToMessage,
} from "~/@core/lib/websocket/emit-message-actions";
import { Avatar } from "~/features/perfil/components/Avatar";
import { MessageAttachments } from "~/features/conversa/components/MessageAttachments";
import { useMe } from "~/@core/application/queries/auth/use-me";
import { MessageContent } from "~/features/conversa/components/MessageContent";
import { LinkEmbeds } from "~/features/conversa/components/LinkEmbed";
import { PollCard } from "~/features/conversa/components/PollCard";
import { ServerTag } from "~/features/perfil/components/ServerTag";
import { UserName } from "~/features/perfil/components/UserName";
import { UserProfilePopover } from "~/features/perfil/components/UserProfilePopover";
import { formatTime, formatTimestamp } from "~/lib/format";
import { carregarFonte, familiaDaFonte } from "~/features/perfil/lib/fontes";
import { cn } from "~/lib/utils";
import { useEdicaoStore } from "~/features/conversa/stores/edicao-store";
import { useConfirmar } from "~/components/ui/confirm";
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
import { copiarTexto } from "~/lib/copiar";
import { useShiftPressionado } from "~/hooks/use-shift";
import { useSegurar } from "~/hooks/use-segurar";
import { useReplyStore } from "~/features/conversa/stores/reply-store";
import { useSuperReacao } from "~/features/expressao/stores/super-reacao";
import { ExpressionPicker } from "~/features/expressao/components/ExpressionPicker";
import { EncaminharModal } from "~/features/conversa/components/EncaminharModal";
import { useIgnoreStore } from "~/stores/ignore-store";
import { useAparencia } from "~/features/configuracoes/stores/aparencia";
import { useTranslation } from "~/traducao";

const QUICK_EMOJIS = ["👍", "🔥", "😂", "❤️", "👀"];

const SUPER_PADRAO = "🔥";

interface MessageItemProps {
  message: PendingMessageModel;
  compact: boolean;
  canDelete: boolean;
  canPin?: boolean;
  isOwn: boolean;
  currentUserId?: string;
  guildId?: string;
  respondida?: PendingMessageModel;
  emojis?: GuildEmoji[];
  enfeites?: EnfeitesDaPessoa;
  mencoes?: ResolverMencoes;
  meMenciona?: boolean;
  destacada?: boolean;
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
  guildId,
  respondida,
  emojis = [],
  enfeites,
  mencoes,
  meMenciona = false,
  destacada = false,
  onRetry,
  onPin,
}) => {
  const { t } = useTranslation();
  const confirmar = useConfirmar();

  const ignorado = useIgnoreStore((s) => s.ignorados).includes(message.author.id);
  useAparencia((s) => s.horaEm24h);

  const mostrarAvatares = useAparencia((s) => s.avatares);
  const mostrarReacoes = useAparencia((s) => s.reacoes);
  const mostrarPrevia = useAparencia((s) => s.previaDeLinks);
  const [revelado, setRevelado] = useState(false);

  const [editing, setEditing] = useState(false);

  const pedidoDeEdicao = useEdicaoStore((s) => s.pedido);
  const recolherPedido = useEdicaoStore((s) => s.recolher);

  useEffect(() => {
    if (pedidoDeEdicao !== message.id) return;

    setDraft(message.content);
    setEditing(true);
    recolherPedido();

    requestAnimationFrame(() => raiz.current?.scrollIntoView({ block: "center" }));
  }, [pedidoDeEdicao, message.id, message.content, recolherPedido]);
  const [draft, setDraft] = useState(message.content);

  useEffect(() => carregarFonte(message.fonte), [message.fonte]);
  const [reagindo, setReagindo] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const [encaminhando, setEncaminhando] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  const saveEdit = async () => {
    const content = draft.trim();
    if (!content || content === message.content) return setEditing(false);

    await editMessage({ messageId: message.id, content }).catch(() => undefined);
    setEditing(false);
  };

  const shift = useShiftPressionado();
  const responder = useReplyStore((s) => s.responder);
  const favoritas = useFavoriteMessageIds();
  const alternarFavorita = useToggleFavoriteMessage();
  const favorita = (favoritas.data ?? []).includes(message.id);

  const urlDoEmoji = (emoji: string) => {
    const nome = /^:([\w~-]+):$/.exec(emoji)?.[1];
    return nome ? (emojis.find((e) => e.name === nome)?.url ?? null) : null;
  };

  const toggleReaction = async (emoji: string) => {
    const mine = message.reactions.find((r) => r.emoji === emoji)?.me;
    await reactToMessage(message.id, emoji, !mine).catch(() => undefined);
    setReagindo(false);
  };

  const superReagir = (emoji: string) => {
    const caixa = raiz.current?.getBoundingClientRect();

    useSuperReacao
      .getState()
      .disparar(
        emoji,
        caixa ? { x: caixa.left + caixa.width / 2, y: caixa.bottom } : undefined,
        urlDoEmoji(emoji),
      );

    void reactToMessage(message.id, emoji, true, true).catch(() => undefined);
    setReagindo(false);
  };

  const copiar = (texto: string, aviso: string) => {
    void copiarTexto(texto).then((deu) =>
      deu ? toast.success(aviso) : toast.error(t("conversa.mensagem.naoDeuParaCopiar")),
    );
  };

  const linkDaMensagem = () =>
    `${window.location.origin}/channels/${guildId ?? "@me"}/${message.channelId}/${message.id}`;

  const marcarNaoLido = () => {
    unreadFromMessage(message.channelId, message.id);
    toast.success(t("conversa.mensagem.naoLidasDaqui"));
  };

  const apagar = () =>
    void confirmar({
      titulo: t("conversa.mensagem.apagarTitulo"),
      descricao: t("conversa.mensagem.apagarDescricao"),
      acao: t("conversa.mensagem.apagarAcao"),
    }).then(({ confirmado }) => confirmado && void deleteMessage(message.id).catch(() => undefined));

  const iniciarResposta = () =>
    responder({
      messageId: message.id,
      channelId: message.channelId,
      autor: message.author.displayName,
      autorId: message.author.id,
    });

  if (message.tipo === "COMANDO") {
    return (
      <div className="group flex items-center gap-2 px-2 py-1 text-sm text-ink-muted transition hover:bg-hover @sm:gap-3 @sm:px-4">
        <SlashSquare size={16} className="shrink-0 text-ink-faint" />
        <span className="max-w-[8rem] truncate font-medium text-ink @sm:max-w-none">
          {message.author.displayName}
        </span>
        <span className="hidden @xs:inline">{t("conversa.mensagem.usou")}</span>
        <span className="min-w-0 truncate text-xs text-ink-muted">
          <MessageContent content={message.content} emojis={emojis} mencoes={mencoes} />
        </span>
        <span className="shrink-0 text-xs text-ink-faint">{formatTime(message.createdAt)}</span>

        {canDelete && (
          <button
            type="button"
            onClick={apagar}
            title={t("conversa.acoes.apagar")}
            aria-label={t("conversa.acoes.apagar")}
            className="shrink-0 rounded p-1 text-ink-faint opacity-0 transition hover:bg-surface-3 hover:text-danger group-hover:opacity-100"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    );
  }

  if (message.tipo === "JOIN") {
    return (
      <div className="my-2 flex items-center gap-2 px-2 py-1 text-sm text-ink-muted @sm:gap-3 @sm:px-4">
        <UserPlus size={16} className="shrink-0 text-online" />
        <span className="shrink-0 font-medium text-ink">{message.author.displayName}</span>
        <span className="min-w-0 truncate">{message.content.replace(/<@[a-f\d]{24}>/gi, "").trim()}</span>
        <span className="shrink-0 text-xs text-ink-faint">{formatTime(message.createdAt)}</span>
      </div>
    );
  }

  return (
    <div
      ref={raiz}
      data-mensagem={message.id}
      className={cn(
        "group relative flex flex-wrap gap-x-2 px-2 py-0.5 transition hover:bg-hover @sm:gap-x-4 @sm:px-4",
        !compact && "mt-4",
        meMenciona &&
          "bg-destaque/10 shadow-[inset_2px_0_0_var(--color-destaque)] hover:bg-destaque/15",
        destacada && "bg-brand/15 shadow-[inset_2px_0_0_var(--color-brand)]",
        message.pending && "opacity-60",
        message.failed && "bg-danger/10",
      )}
    >
      {message.replyToId && (
        <Citacao
          respondida={respondida}
          emojis={emojis}
          mencoes={mencoes}
          currentUserId={currentUserId}
        />
      )}

      <div className="w-10 shrink-0">
        {compact || !mostrarAvatares ? (
          <span className="hidden text-10 leading-6 text-ink-faint group-hover:block">
            {formatTime(message.createdAt)}
          </span>
        ) : (
          <UserProfilePopover userId={message.author.id}>
            <button className="rounded-full transition hover:brightness-110">
              <Avatar
                id={message.author.id}
                name={message.author.displayName}
                url={message.author.avatarUrl}
                enfeites={enfeites?.perfil}
              />
            </button>
          </UserProfilePopover>
        )}
      </div>

      <div className="min-w-0 flex-1">
        {!compact && (
          <div className="flex items-baseline gap-x-2">
            <UserProfilePopover userId={message.author.id}>
              <button className="min-w-0 max-w-full truncate font-medium text-ink hover:underline">
                <UserName
                  nome={message.author.displayName}
                  perfil={enfeites?.perfil}
                  corDoCargo={enfeites?.corDoCargo}
                  ehBot={message.author.isBot}
                />
              </button>
            </UserProfilePopover>
            <ServerTag etiqueta={enfeites?.perfil?.etiquetaDoServidor} />
            <span className="shrink-0 text-xs text-ink-faint" title={formatTimestamp(message.createdAt)}>
              <span className="@md:hidden">{formatTime(message.createdAt)}</span>
              <span className="hidden @md:inline">{formatTimestamp(message.createdAt)}</span>
            </span>
            {message.pinnedAt && (
              <span className="flex shrink-0 items-center gap-1 text-10 text-ink-faint">
                <Pin size={10} /> {t("conversa.mensagem.fixada")}
              </span>
            )}
          </div>
        )}

        {ignorado && !revelado ? (
          <p className="my-1 flex items-center gap-2 text-sm italic text-ink-faint">
            {t("conversa.mensagem.ignorada")}
            <button onClick={() => setRevelado(true)} className="not-italic text-brand hover:underline">
              {t("conversa.mensagem.mostrar")}
            </button>
          </p>
        ) : editing ? (
          <div className="my-1">
            <Textarea
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
            <p className="mt-1 text-xs text-ink-faint">
              {t("conversa.mensagem.escPara")}{" "}
              <button onClick={() => setEditing(false)} className="text-brand hover:underline">
                {t("conversa.mensagem.cancelar")}
              </button>{" "}
              · {t("conversa.mensagem.enterParaSalvar")}
            </p>
          </div>
        ) : (
          message.content && (
            <div
              className="whitespace-pre-wrap break-words text-ink-muted"
              style={{ fontFamily: familiaDaFonte(message.fonte) ?? undefined }}
            >
              <MessageContent content={message.content} emojis={emojis} mencoes={mencoes} blocos />
              {message.editedAt && (
                <span className="ml-1 text-10 text-ink-faint">
                  {t("conversa.mensagem.editado")}
                </span>
              )}
            </div>
          )
        )}

        {mostrarPrevia && !editing && !(ignorado && !revelado) && message.content && (
          <LinkEmbeds content={message.content} />
        )}

        {message.sticker && (
          <img
            src={message.sticker.url}
            alt={message.sticker.name}
            title={message.sticker.name}
            className="mt-1 size-40 max-w-full object-contain"
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
            <RotateCw size={12} /> {t("conversa.mensagem.falhou")}
          </button>
        )}

        {mostrarReacoes && message.reactions.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {message.reactions.map((reaction) => (
              <PilulaDeReacao
                key={reaction.emoji}
                reaction={reaction}
                emojis={emojis}
                onReagir={() => void toggleReaction(reaction.emoji)}
                onSuper={() => superReagir(reaction.emoji)}
              />
            ))}
          </div>
        )}
      </div>

      {!message.pending && !message.failed && !editing && (
        <div
          className={cn(
            "absolute -top-3 right-2 z-10 max-w-[calc(100%-1rem)] items-center gap-0.5 rounded border border-line bg-surface-1 p-0.5 shadow-lg @sm:right-4",
            "group-hover:flex group-focus-within:flex",
            reagindo || menuAberto ? "flex" : "hidden",
          )}
        >
          {mostrarReacoes &&
            QUICK_EMOJIS.map((emoji) => (
            <AtalhoDeReacao
              key={emoji}
              emoji={emoji}
              className="hidden @md:block"
                onReagir={() => void toggleReaction(emoji)}
                onSuper={() => superReagir(emoji)}
              />
            ))}

          {mostrarReacoes && (
          <Popover open={reagindo} onOpenChange={setReagindo}>
            <PopoverTrigger asChild>
              <AcaoDaBarra titulo={t("conversa.acoes.reagir")}>
                <SmilePlus size={16} />
              </AcaoDaBarra>
            </PopoverTrigger>

            <PopoverContent side="top" align="end" className="w-auto border-0 bg-transparent p-0">
              <ExpressionPicker
                guildId={guildId}
                modo="reacao"
                onFechar={() => setReagindo(false)}
                onEmoji={(texto) => void toggleReaction(texto)}
              />
            </PopoverContent>
          </Popover>
          )}

          <AcaoDaBarra titulo={t("conversa.acoes.responder")} onClick={iniciarResposta}>
            <CornerUpLeft size={16} />
          </AcaoDaBarra>

          <AcaoDaBarra
            titulo={t("conversa.acoes.encaminhar")}
            className="hidden @sm:block"
            onClick={() => setEncaminhando(true)}
          >
            <Forward size={16} />
          </AcaoDaBarra>

          {shift && (
            <>
              <AcaoDaBarra
                titulo={t(
                  favorita ? "conversa.acoes.tirarDosFavoritos" : "conversa.acoes.favoritar",
                )}
                onClick={() => alternarFavorita.mutate({ messageId: message.id, favorita })}
                className={cn("hidden @md:block", favorita && "text-brand")}
              >
                <Bookmark size={16} className={favorita ? "fill-current" : undefined} />
              </AcaoDaBarra>

              <AcaoDaBarra
                titulo={t("conversa.acoes.marcarNaoLida")}
                className="hidden @md:block"
                onClick={marcarNaoLido}
              >
                <MailOpen size={16} />
              </AcaoDaBarra>

              <AcaoDaBarra
                titulo={t("conversa.acoes.copiarLink")}
                className="hidden @md:block"
                onClick={() => copiar(linkDaMensagem(), t("conversa.mensagem.linkCopiado"))}
              >
                <Link2 size={16} />
              </AcaoDaBarra>

              <AcaoDaBarra
                titulo={t("conversa.acoes.copiarId")}
                className="hidden @md:block"
                onClick={() => copiar(message.id, t("conversa.mensagem.idCopiado"))}
              >
                <Hash size={16} />
              </AcaoDaBarra>
            </>
          )}

          {canPin && (
            <AcaoDaBarra
              titulo={t(message.pinnedAt ? "conversa.acoes.desafixar" : "conversa.acoes.fixar")}
              className="hidden @sm:block"
              onClick={() => onPin?.(message, !message.pinnedAt)}
            >
              {message.pinnedAt ? <PinOff size={16} /> : <Pin size={16} />}
            </AcaoDaBarra>
          )}

          {isOwn && (
            <AcaoDaBarra
              titulo={t("conversa.acoes.editar")}
              className="hidden @sm:block"
              onClick={() => {
                setDraft(message.content);
                setEditing(true);
              }}
            >
              <Pencil size={16} />
            </AcaoDaBarra>
          )}

          {canDelete && (
            <AcaoDaBarra
              titulo={t("conversa.acoes.apagar")}
              onClick={apagar}
              className="hidden hover:text-danger @sm:block"
            >
              <Trash2 size={16} />
            </AcaoDaBarra>
          )}

          <DropdownMenu open={menuAberto} onOpenChange={setMenuAberto}>
            <DropdownMenuTrigger asChild>
              <AcaoDaBarra titulo={t("conversa.acoes.mais")}>
                <MoreHorizontal size={16} />
              </AcaoDaBarra>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuItem onSelect={iniciarResposta}>
                {t("conversa.acoes.responder")} <CornerUpLeft size={16} />
              </DropdownMenuItem>

              <DropdownMenuItem onSelect={() => setEncaminhando(true)}>
                {t("conversa.acoes.encaminhar")} <Forward size={16} />
              </DropdownMenuItem>

              {mostrarReacoes && (
                <>
                  <DropdownMenuItem onSelect={() => setReagindo(true)}>
                    {t("conversa.acoes.adicionarReacao")} <SmilePlus size={16} />
                  </DropdownMenuItem>

                  <DropdownMenuItem onSelect={() => superReagir(SUPER_PADRAO)}>
                    {t("conversa.acoes.superReagirCom", { emoji: SUPER_PADRAO })}{" "}
                    <Sparkles size={16} />
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />

              {canPin && (
                <DropdownMenuItem onSelect={() => onPin?.(message, !message.pinnedAt)}>
                  {t(
                    message.pinnedAt
                      ? "conversa.acoes.desafixarMensagem"
                      : "conversa.acoes.fixarMensagem",
                  )}
                  {message.pinnedAt ? <PinOff size={16} /> : <Pin size={16} />}
                </DropdownMenuItem>
              )}

              {isOwn && (
                <DropdownMenuItem
                  onSelect={() => {
                    setDraft(message.content);
                    setEditing(true);
                  }}
                >
                  {t("conversa.acoes.editarMensagem")} <Pencil size={16} />
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onSelect={() => alternarFavorita.mutate({ messageId: message.id, favorita })}
              >
                {t(favorita ? "conversa.acoes.tirarDosFavoritos" : "conversa.acoes.favoritar")}
                <Bookmark size={16} className={favorita ? "fill-current text-brand" : undefined} />
              </DropdownMenuItem>

              <DropdownMenuItem onSelect={marcarNaoLido}>
                {t("conversa.acoes.marcarNaoLida")} <MailOpen size={16} />
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onSelect={() => copiar(linkDaMensagem(), t("conversa.mensagem.linkCopiado"))}
              >
                {t("conversa.acoes.copiarLink")} <Link2 size={16} />
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={() => copiar(message.id, t("conversa.mensagem.idCopiado"))}
              >
                {t("conversa.acoes.copiarId")} <Copy size={16} />
              </DropdownMenuItem>

              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={apagar} className="text-danger focus:text-danger">
                    {t("conversa.acoes.apagarMensagem")} <Trash2 size={16} />
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <EncaminharModal
        aberto={encaminhando}
        onFechar={() => setEncaminhando(false)}
        mensagem={message}
        guildId={guildId}
      />
    </div>
  );
};

export const shouldGroup = (prev: Message | undefined, current: Message) =>
  Boolean(
    prev &&
      prev.author.id === current.author.id &&
      new Date(current.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60_000,
  );

const EmojiDaReacao: React.FC<{ emoji: string; doServidor: GuildEmoji[] }> = ({
  emoji,
  doServidor,
}) => {
  const nome = /^:([\w~-]+):$/.exec(emoji)?.[1];
  const achado = nome ? doServidor.find((e) => e.name === nome) : undefined;

  if (!achado) return <Emoji emoji={emoji} className="size-5" />;

  return <img src={achado.url} alt={emoji} title={emoji} className="size-5 object-contain" />;
};

const AcaoDaBarra = React.forwardRef<
  HTMLButtonElement,
  { titulo: string; className?: string; onClick?: () => void; children: React.ReactNode }
>(({ titulo, className, onClick, children, ...props }, ref) => (
  <button
    ref={ref}
    onClick={onClick}
    title={titulo}
    aria-label={titulo}
    className={cn(
      "rounded p-1.5 text-ink-muted transition hover:bg-surface-3 hover:text-ink",
      className,
    )}
    {...props}
  >
    {children}
  </button>
));
AcaoDaBarra.displayName = "AcaoDaBarra";

const AtalhoDeReacao: React.FC<{
  emoji: string;
  className?: string;
  onReagir: () => void;
  onSuper: () => void;
}> = ({ emoji, className, onReagir, onSuper }) => {
  const { t } = useTranslation();

  return (
    <button
      {...useSegurar(onReagir, onSuper)}
      title={t("conversa.mensagem.reagirCom", { emoji })}
      className={cn("rounded px-1.5 py-1 text-base hover:bg-surface-3", className)}
    >
      {emoji}
    </button>
  );
};

const PilulaDeReacao: React.FC<{
  reaction: Message["reactions"][number];
  emojis: GuildEmoji[];
  onReagir: () => void;
  onSuper: () => void;
}> = ({ reaction, emojis, onReagir, onSuper }) => {
  const { t } = useTranslation();

  return (
    <button
      {...useSegurar(onReagir, onSuper)}
      title={t("conversa.mensagem.segureParaSuper", { emoji: reaction.emoji })}
      className={cn(
        "flex max-w-full shrink-0 items-center gap-1 rounded border px-2 py-0.5 text-sm transition",
        reaction.me ? "border-brand bg-brand/20" : "border-transparent bg-surface-3 hover:border-ink-faint",
        reaction.burst && "shadow-[0_0_0_1px_var(--color-idle),0_0_10px_-2px_var(--color-idle)]",
      )}
    >
      <EmojiDaReacao emoji={reaction.emoji} doServidor={emojis} />
      <span className="text-xs font-medium text-ink-muted">{reaction.count}</span>
    </button>
  );
};

const Citacao: React.FC<{
  respondida?: PendingMessageModel;
  emojis: GuildEmoji[];
  mencoes?: ResolverMencoes;
  currentUserId?: string;
}> = ({ respondida, emojis, mencoes, currentUserId }) => {
  const { t } = useTranslation();

  const me = useMe(true).data;
  const souEu = Boolean(currentUserId && respondida?.author.id === currentUserId);
  const avatarUrl = souEu && me ? me.avatarUrl : respondida?.author.avatarUrl;

  return (
  <div className="mb-0.5 flex h-5 w-full items-center gap-1.5 overflow-hidden pl-5 text-xs">
    <span
      aria-hidden
      className="-mb-0.5 h-4 w-5 shrink-0 self-end rounded-tl-lg border-l-2 border-t-2 border-line"
    />

    {respondida ? (
      <>
        <UserProfilePopover userId={respondida.author.id}>
          <button className="flex min-w-0 shrink-0 items-center gap-1.5 rounded transition hover:brightness-110">
            <Avatar
              id={respondida.author.id}
              name={respondida.author.displayName}
              url={avatarUrl}
              size={16}
            />
            <span className="max-w-[7rem] truncate font-medium text-ink hover:underline @sm:max-w-[12rem]">
              @{respondida.author.displayName}
            </span>
          </button>
        </UserProfilePopover>
        <span className="min-w-0 truncate text-ink-muted [&_img]:inline-block [&_img]:size-4 [&_img]:align-text-bottom">
          {respondida.content ? (
            <MessageContent content={respondida.content} emojis={emojis} mencoes={mencoes} />
          ) : (
            t("conversa.mensagem.citacaoAnexo")
          )}
        </span>
      </>
    ) : (
      <span className="italic text-ink-faint">{t("conversa.mensagem.citacaoSumiu")}</span>
    )}
    </div>
  );
};
