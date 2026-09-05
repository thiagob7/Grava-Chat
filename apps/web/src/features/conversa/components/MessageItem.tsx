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
import type { Attachment, GuildEmoji, Message } from "@gravae/shared";

import { Emoji } from "~/features/expressao/components/Emoji";
import { emojisRecentes } from "~/features/expressao/lib/emoji";
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
import { removerAnexo } from "~/@core/application/requests/message/remover-anexo";
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
import { flxCls } from "~/lib/compat-fluxer";

const QUICK_PADRAO = ["👍", "🔥", "😂", "❤️"];

/// Os quatro que a pessoa mais usa, completados com os de fábrica quando ela
/// ainda não reagiu o bastante para haver histórico.
function atalhosDeReacao(): string[] {
  const usados = emojisRecentes().filter((e) => e.length <= 8);

  return [...new Set([...usados, ...QUICK_PADRAO])].slice(0, 4);
}

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
  const atalhos = React.useMemo(atalhosDeReacao, []);
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

  const apagarMesmo = () => void deleteMessage(message.id).catch(() => undefined);

  const apagarAnexo = (anexo: Attachment) =>
    void confirmar({
      titulo: t("conversa.anexos.excluirTitulo"),
      descricao: t("conversa.anexos.excluirDescricao", { arquivo: anexo.filename }),
      acao: t("conversa.anexos.excluirAcao"),
      destrutivo: true,
    }).then(({ confirmado }) => {
      if (!confirmado) return;

      void removerAnexo(message.id, anexo.id).catch(() =>
        toast.error(t("conversa.anexos.excluirFalhou")),
      );
    });

  const apagar = () => {
    /// Segurando Shift, some direto — é a saída pra quem está limpando várias.
    if (shift) return apagarMesmo();

    void confirmar({
      titulo: t("conversa.mensagem.apagarTitulo"),
      descricao: (
        <>
          {t("conversa.mensagem.apagarDescricao")}
          <PreviaDaMensagem data-gc="conversa.message-item.previa-da-mensagem" message={message} emojis={emojis} />
        </>
      ),
      acao: t("conversa.mensagem.apagarAcao"),
      destrutivo: true,
      dicaDoShift: true,
    }).then(({ confirmado }) => confirmado && apagarMesmo());
  };

  const iniciarResposta = () =>
    responder({
      messageId: message.id,
      channelId: message.channelId,
      autor: message.author.displayName,
      autorId: message.author.id,
    });

  if (message.tipo === "COMANDO") {
    return (
      <div data-gc="conversa.message-item.div" className="group flex items-center gap-2 px-2 py-1 text-sm text-ink-muted transition hover:bg-hover @sm:gap-3 @sm:px-4">
        <SlashSquare data-gc="conversa.message-item.slash-square" size={16} className="shrink-0 text-ink-faint" />
        <span data-gc="conversa.message-item.span" className="max-w-[8rem] truncate font-medium text-ink @sm:max-w-none">
          {message.author.displayName}
        </span>
        <span data-gc="conversa.message-item.span--2" className="hidden @xs:inline">{t("conversa.mensagem.usou")}</span>
        <span data-gc="conversa.message-item.span--3" className="min-w-0 truncate text-xs text-ink-muted">
          <MessageContent data-gc="conversa.message-item.message-content" content={message.content} emojis={emojis} mencoes={mencoes} />
        </span>
        <span data-gc="conversa.message-item.span--4" className="shrink-0 text-xs text-ink-faint">{formatTime(message.createdAt)}</span>

        {canDelete && (
          <button data-gc="conversa.message-item.button.apagar"
            type="button"
            onClick={apagar}
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

  if (message.tipo === "JOIN") {
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
      ref={raiz}
      data-mensagem={message.id}
      className={cn(
        "group relative flex flex-wrap gap-x-2 px-2 py-0.5 transition hover:bg-hover @sm:gap-x-4 @sm:px-4",
        !compact && "mt-4",
        meMenciona &&
          cn(
            "bg-destaque/10 shadow-[inset_2px_0_0_var(--color-destaque)] hover:bg-destaque/15",
            flxCls("mensagemQueMenciona"),
          ),
        destacada && "bg-brand/15 shadow-[inset_2px_0_0_var(--color-brand)]",
        message.pending && "opacity-60",
        message.failed && "bg-danger/10",
      )}
    >
      {message.replyToId && (
        <Citacao data-gc="conversa.message-item.citacao"
          respondida={respondida}
          emojis={emojis}
          mencoes={mencoes}
          currentUserId={currentUserId}
        />
      )}

      <div data-gc="conversa.message-item.div--4" className="w-10 shrink-0">
        {compact || !mostrarAvatares ? (
          <span data-gc="conversa.message-item.span--8" className="hidden text-10 leading-6 text-ink-faint group-hover:block">
            {formatTime(message.createdAt)}
          </span>
        ) : (
          <UserProfilePopover data-gc="conversa.message-item.user-profile-popover" userId={message.author.id}>
            <button data-gc="conversa.message-item.button" className="rounded-full transition hover:brightness-110">
              <Avatar data-gc="conversa.message-item.avatar"
                id={message.author.id}
                name={message.author.displayName}
                url={message.author.avatarUrl}
                enfeites={enfeites?.perfil}
              />
            </button>
          </UserProfilePopover>
        )}
      </div>

      <div data-gc="conversa.message-item.div--5" className="min-w-0 flex-1">
        {!compact && (
          <div data-gc="conversa.message-item.div--6" className="flex items-baseline gap-x-2">
            <UserProfilePopover data-gc="conversa.message-item.user-profile-popover--2" userId={message.author.id}>
              <button data-gc="conversa.message-item.button--2" className="min-w-0 max-w-full truncate font-medium text-ink hover:underline">
                <UserName data-gc="conversa.message-item.user-name"
                  nome={message.author.displayName}
                  perfil={enfeites?.perfil}
                  corDoCargo={enfeites?.corDoCargo}
                  ehBot={message.author.isBot}
                />
              </button>
            </UserProfilePopover>
            <ServerTag data-gc="conversa.message-item.server-tag" etiqueta={enfeites?.perfil?.etiquetaDoServidor} />
            <span data-gc="conversa.message-item.span--9" className="shrink-0 text-xs text-ink-faint" title={formatTimestamp(message.createdAt)}>
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

        {ignorado && !revelado ? (
          <p data-gc="conversa.message-item.p" className="my-1 flex items-center gap-2 text-sm italic text-ink-faint">
            {t("conversa.mensagem.ignorada")}
            <button data-gc="conversa.message-item.button--3" onClick={() => setRevelado(true)} className="not-italic text-brand hover:underline">
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
              className={cn("whitespace-pre-wrap break-words text-ink-muted", flxCls("conteudoDaMensagem"))}
              style={{ fontFamily: familiaDaFonte(message.fonte) ?? undefined }}
            >
              <MessageContent data-gc="conversa.message-item.message-content--2" content={message.content} emojis={emojis} mencoes={mencoes} blocos />
              {message.editedAt && (
                <span data-gc="conversa.message-item.span--13" className="ml-1 text-10 text-ink-faint">
                  {t("conversa.mensagem.editado")}
                </span>
              )}
            </div>
          )
        )}

        {mostrarPrevia && !editing && !(ignorado && !revelado) && message.content && (
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
          onRemover={canDelete ? apagarAnexo : undefined}
        />

        {message.failed && (
          <button data-gc="conversa.message-item.button--5"
            onClick={() => onRetry(message)}
            className="mt-1 flex items-center gap-1 text-xs text-danger hover:underline"
          >
            <RotateCw data-gc="conversa.message-item.rotate-cw" size={12} /> {t("conversa.mensagem.falhou")}
          </button>
        )}

        {mostrarReacoes && message.reactions.length > 0 && (
          <div data-gc="conversa.message-item.div--9" className="mt-1 flex flex-wrap gap-1">
            {message.reactions.map((reaction) => (
              <PilulaDeReacao data-gc="conversa.message-item.pilula-de-reacao"
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
        <div data-gc="conversa.message-item.div--10"
          className={cn(
            "barra-da-mensagem absolute -top-3 right-2 z-10 max-w-[calc(100%-1rem)] items-center gap-0.5 rounded border border-line bg-surface-1 p-0.5 shadow-lg @sm:right-4",
            flxCls("barraDaMensagem"),
            "group-hover:flex group-focus-within:flex",
            reagindo || menuAberto ? "flex" : "hidden",
          )}
        >
          {mostrarReacoes &&
            atalhos.map((emoji) => (
              <AtalhoDeReacao data-gc="conversa.message-item.atalho-de-reacao"
                key={emoji}
                emoji={emoji}
                onReagir={() => void toggleReaction(emoji)}
                onSuper={() => superReagir(emoji)}
              />
            ))}

          {mostrarReacoes && (
          <Popover data-gc="conversa.message-item.popover.set-reagindo" open={reagindo} onOpenChange={setReagindo}>
            <PopoverTrigger data-gc="conversa.message-item.popover-trigger" asChild>
              <AcaoDaBarra data-gc="conversa.message-item.acao-da-barra" titulo={t("conversa.acoes.reagir")}>
                <SmilePlus data-gc="conversa.message-item.smile-plus" size={16} />
              </AcaoDaBarra>
            </PopoverTrigger>

            <PopoverContent data-gc="conversa.message-item.popover-content" side="top" align="end" className="w-auto border-0 bg-transparent p-0">
              <ExpressionPicker data-gc="conversa.message-item.expression-picker"
                guildId={guildId}
                modo="reacao"
                onFechar={() => setReagindo(false)}
                onEmoji={(texto) => void toggleReaction(texto)}
              />
            </PopoverContent>
          </Popover>
          )}

          <AcaoDaBarra data-gc="conversa.message-item.acao-da-barra.iniciar-resposta" titulo={t("conversa.acoes.responder")} onClick={iniciarResposta}>
            <CornerUpLeft data-gc="conversa.message-item.corner-up-left" size={16} />
          </AcaoDaBarra>

          <AcaoDaBarra data-gc="conversa.message-item.acao-da-barra--2"
            titulo={t("conversa.acoes.encaminhar")}
            onClick={() => setEncaminhando(true)}
          >
            <Forward data-gc="conversa.message-item.forward" size={16} />
          </AcaoDaBarra>

          {shift && (
            <>
              <AcaoDaBarra data-gc="conversa.message-item.acao-da-barra--3"
                titulo={t(
                  favorita ? "conversa.acoes.tirarDosFavoritos" : "conversa.acoes.favoritar",
                )}
                onClick={() => alternarFavorita.mutate({ messageId: message.id, favorita })}
                className={cn(favorita && "text-brand")}
              >
                <Bookmark data-gc="conversa.message-item.bookmark" size={16} className={favorita ? "fill-current" : undefined} />
              </AcaoDaBarra>

              <AcaoDaBarra data-gc="conversa.message-item.acao-da-barra.marcar-nao-lido"
                titulo={t("conversa.acoes.marcarNaoLida")}
                onClick={marcarNaoLido}
              >
                <MailOpen data-gc="conversa.message-item.mail-open" size={16} />
              </AcaoDaBarra>

              <AcaoDaBarra data-gc="conversa.message-item.acao-da-barra--4"
                titulo={t("conversa.acoes.copiarLink")}
                onClick={() => copiar(linkDaMensagem(), t("conversa.mensagem.linkCopiado"))}
              >
                <Link2 data-gc="conversa.message-item.link2" size={16} />
              </AcaoDaBarra>

              <AcaoDaBarra data-gc="conversa.message-item.acao-da-barra--5"
                titulo={t("conversa.acoes.copiarId")}
                onClick={() => copiar(message.id, t("conversa.mensagem.idCopiado"))}
              >
                <Hash data-gc="conversa.message-item.hash" size={16} />
              </AcaoDaBarra>
            </>
          )}

          {canPin && (
            <AcaoDaBarra data-gc="conversa.message-item.acao-da-barra--6"
              titulo={t(message.pinnedAt ? "conversa.acoes.desafixar" : "conversa.acoes.fixar")}
              onClick={() => onPin?.(message, !message.pinnedAt)}
            >
              {message.pinnedAt ? <PinOff data-gc="conversa.message-item.pin-off" size={16} /> : <Pin data-gc="conversa.message-item.pin--2" size={16} />}
            </AcaoDaBarra>
          )}

          {isOwn && (
            <AcaoDaBarra data-gc="conversa.message-item.acao-da-barra--7"
              titulo={t("conversa.acoes.editar")}
              onClick={() => {
                setDraft(message.content);
                setEditing(true);
              }}
            >
              <Pencil data-gc="conversa.message-item.pencil" size={16} />
            </AcaoDaBarra>
          )}

          {canDelete && (
            <AcaoDaBarra data-gc="conversa.message-item.acao-da-barra.apagar"
              titulo={t("conversa.acoes.apagar")}
              onClick={apagar}
              className="hover:text-danger"
            >
              <Trash2 data-gc="conversa.message-item.trash2--2" size={16} />
            </AcaoDaBarra>
          )}

          <DropdownMenu data-gc="conversa.message-item.dropdown-menu.set-menu-aberto" open={menuAberto} onOpenChange={setMenuAberto}>
            <DropdownMenuTrigger data-gc="conversa.message-item.dropdown-menu-trigger" asChild>
              <AcaoDaBarra data-gc="conversa.message-item.acao-da-barra--8" titulo={t("conversa.acoes.mais")}>
                <MoreHorizontal data-gc="conversa.message-item.more-horizontal" size={16} />
              </AcaoDaBarra>
            </DropdownMenuTrigger>

            <DropdownMenuContent data-gc="conversa.message-item.dropdown-menu-content" align="end" className="w-60">
              {mostrarReacoes && (
                <div data-gc="conversa.message-item.div--11" className="mb-1 flex items-center gap-0.5 border-b border-line px-1 pb-1.5">
                  {atalhos.map((emoji) => (
                    <AtalhoDeReacao data-gc="conversa.message-item.atalho-de-reacao--2"
                      key={emoji}
                      emoji={emoji}
                      onReagir={() => {
                        setMenuAberto(false);
                        void toggleReaction(emoji);
                      }}
                      onSuper={() => {
                        setMenuAberto(false);
                        superReagir(emoji);
                      }}
                    />
                  ))}

                  <AcaoDaBarra data-gc="conversa.message-item.acao-da-barra--9"
                    titulo={t("conversa.acoes.reagir")}
                    className="ml-auto"
                    onClick={() => {
                      setMenuAberto(false);
                      setReagindo(true);
                    }}
                  >
                    <SmilePlus data-gc="conversa.message-item.smile-plus--2" size={16} />
                  </AcaoDaBarra>
                </div>
              )}

              <DropdownMenuItem data-gc="conversa.message-item.dropdown-menu-item.iniciar-resposta" onSelect={iniciarResposta}>
                {t("conversa.acoes.responder")} <CornerUpLeft data-gc="conversa.message-item.corner-up-left--2" size={16} />
              </DropdownMenuItem>

              <DropdownMenuItem data-gc="conversa.message-item.dropdown-menu-item" onSelect={() => setEncaminhando(true)}>
                {t("conversa.acoes.encaminhar")} <Forward data-gc="conversa.message-item.forward--2" size={16} />
              </DropdownMenuItem>

              {mostrarReacoes && (
                <>
                  <DropdownMenuItem data-gc="conversa.message-item.dropdown-menu-item--2" onSelect={() => setReagindo(true)}>
                    {t("conversa.acoes.adicionarReacao")} <SmilePlus data-gc="conversa.message-item.smile-plus--3" size={16} />
                  </DropdownMenuItem>

                  <DropdownMenuItem data-gc="conversa.message-item.dropdown-menu-item--3" onSelect={() => superReagir(SUPER_PADRAO)}>
                    {t("conversa.acoes.superReagirCom", { emoji: SUPER_PADRAO })}{" "}
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
                onSelect={() => alternarFavorita.mutate({ messageId: message.id, favorita })}
              >
                {t(favorita ? "conversa.acoes.tirarDosFavoritos" : "conversa.acoes.favoritar")}
                <Bookmark data-gc="conversa.message-item.bookmark--2" size={16} className={favorita ? "fill-current text-brand" : undefined} />
              </DropdownMenuItem>

              <DropdownMenuItem data-gc="conversa.message-item.dropdown-menu-item.marcar-nao-lido" onSelect={marcarNaoLido}>
                {t("conversa.acoes.marcarNaoLida")} <MailOpen data-gc="conversa.message-item.mail-open--2" size={16} />
              </DropdownMenuItem>

              <DropdownMenuSeparator data-gc="conversa.message-item.dropdown-menu-separator--2" />

              <DropdownMenuItem data-gc="conversa.message-item.dropdown-menu-item--7"
                onSelect={() => copiar(linkDaMensagem(), t("conversa.mensagem.linkCopiado"))}
              >
                {t("conversa.acoes.copiarLink")} <Link2 data-gc="conversa.message-item.link2--2" size={16} />
              </DropdownMenuItem>

              <DropdownMenuItem data-gc="conversa.message-item.dropdown-menu-item--8"
                onSelect={() => copiar(message.id, t("conversa.mensagem.idCopiado"))}
              >
                {t("conversa.acoes.copiarId")} <Copy data-gc="conversa.message-item.copy" size={16} />
              </DropdownMenuItem>

              {canDelete && (
                <>
                  <DropdownMenuSeparator data-gc="conversa.message-item.dropdown-menu-separator--3" />
                  <DropdownMenuItem data-gc="conversa.message-item.dropdown-menu-item.apagar" onSelect={apagar} className="text-danger focus:text-danger">
                    {t("conversa.acoes.apagarMensagem")} <Trash2 data-gc="conversa.message-item.trash2--3" size={16} />
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <EncaminharModal data-gc="conversa.message-item.encaminhar-modal"
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

  if (!achado) return <Emoji data-gc="conversa.message-item.emoji" emoji={emoji} className="size-5" />;

  return <img data-gc="conversa.message-item.img--2" src={achado.url} alt={emoji} title={emoji} className="size-5 object-contain" />;
};

const AcaoDaBarra = React.forwardRef<
  HTMLButtonElement,
  { titulo: string; className?: string; onClick?: () => void; children: React.ReactNode }
>(({ titulo, className, onClick, children, ...props }, ref) => (
  <button data-gc="conversa.message-item.button.on-click"
    ref={ref}
    onClick={onClick}
    title={titulo}
    aria-label={titulo}
    className={cn(
      "flex size-7 shrink-0 items-center justify-center rounded text-ink-muted transition hover:bg-surface-3 hover:text-ink",
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
    <button data-gc="conversa.message-item.button--6"
      {...useSegurar(onReagir, onSuper)}
      title={t("conversa.mensagem.reagirCom", { emoji })}
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded text-base leading-none transition hover:bg-surface-3",
        className,
      )}
    >
      <Emoji data-gc="conversa.message-item.emoji--2" emoji={emoji} className="size-5" />
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
    <button data-gc="conversa.message-item.button--7"
      {...useSegurar(onReagir, onSuper)}
      title={t("conversa.mensagem.segureParaSuper", { emoji: reaction.emoji })}
      className={cn(
        "flex max-w-full shrink-0 items-center gap-1 rounded border px-2 py-0.5 text-sm transition",
        flxCls("botaoDeReacao"),
        reaction.me ? "border-brand bg-brand/20" : "border-transparent bg-surface-3 hover:border-ink-faint",
        reaction.burst && "shadow-[0_0_0_1px_var(--color-idle),0_0_10px_-2px_var(--color-idle)]",
      )}
    >
      <EmojiDaReacao data-gc="conversa.message-item.emoji-da-reacao" emoji={reaction.emoji} doServidor={emojis} />
      <span data-gc="conversa.message-item.span--14" className="text-xs font-medium text-ink-muted">{reaction.count}</span>
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
  <div data-gc="conversa.message-item.div--12" className="mb-0.5 flex h-5 w-full items-center gap-1.5 overflow-hidden pl-5 text-xs">
    <span data-gc="conversa.message-item.span--15"
      aria-hidden
      className="-mb-0.5 h-4 w-5 shrink-0 self-end rounded-tl-lg border-l-2 border-t-2 border-line"
    />

    {respondida ? (
      <>
        <UserProfilePopover data-gc="conversa.message-item.user-profile-popover--3" userId={respondida.author.id}>
          <button data-gc="conversa.message-item.button--8" className="flex min-w-0 shrink-0 items-center gap-1.5 rounded transition hover:brightness-110">
            <Avatar data-gc="conversa.message-item.avatar--2"
              id={respondida.author.id}
              name={respondida.author.displayName}
              url={avatarUrl}
              size={16}
            />
            <span data-gc="conversa.message-item.span--16" className="max-w-[7rem] truncate font-medium text-ink hover:underline @sm:max-w-[12rem]">
              @{respondida.author.displayName}
            </span>
          </button>
        </UserProfilePopover>
        <span data-gc="conversa.message-item.span--17" className="min-w-0 truncate text-ink-muted [&_img]:inline-block [&_img]:size-4 [&_img]:align-text-bottom">
          {respondida.content ? (
            <MessageContent data-gc="conversa.message-item.message-content--3" content={respondida.content} emojis={emojis} mencoes={mencoes} />
          ) : (
            t("conversa.mensagem.citacaoAnexo")
          )}
        </span>
      </>
    ) : (
      <span data-gc="conversa.message-item.span--18" className="italic text-ink-faint">{t("conversa.mensagem.citacaoSumiu")}</span>
    )}
    </div>
  );
};

/// A mensagem que vai sumir, dentro da confirmação. Sem ações e sem hover:
/// aqui ela é só a prova de que é esta mesma, e não a de cima.
const PreviaDaMensagem: React.FC<{
  message: Message | PendingMessageModel;
  emojis: GuildEmoji[];
}> = ({ message, emojis }) => (
  <div data-gc="conversa.message-item.div--13" className="mt-3 max-h-56 overflow-y-auto rounded-lg border border-line bg-surface-2 p-3">
    <div data-gc="conversa.message-item.div--14" className="flex items-baseline gap-2">
      <Avatar data-gc="conversa.message-item.avatar--3"
        id={message.author.id}
        name={message.author.displayName}
        url={message.author.avatarUrl}
        size={20}
      />
      <span data-gc="conversa.message-item.span--19" className="truncate text-sm font-medium">{message.author.displayName}</span>
      <span data-gc="conversa.message-item.span--20" className="shrink-0 text-xs text-ink-faint">
        {formatTimestamp(message.createdAt)}
      </span>
    </div>

    <div data-gc="conversa.message-item.div--15" className="mt-1 break-words text-sm text-ink-muted">
      {message.content ? (
        <MessageContent data-gc="conversa.message-item.message-content--4" content={message.content} emojis={emojis} blocos />
      ) : (
        <span data-gc="conversa.message-item.span--21" className="italic text-ink-faint">sem texto</span>
      )}
    </div>
  </div>
);
