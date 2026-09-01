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

import type { PendingMessageModel } from "~/@core/domain/models/message-model";
import type { EnfeitesDaPessoa } from "~/hooks/use-enfeites";
import type { ResolverMencoes } from "~/hooks/use-mencoes";
import {
  deleteMessage,
  editMessage,
  reactToMessage,
} from "~/@core/lib/websocket/emit-message-actions";
import { Avatar } from "~/components/Avatar";
import { MessageAttachments } from "~/components/MessageAttachments";
import { MessageContent } from "~/components/MessageContent";
import { LinkEmbeds } from "~/components/LinkEmbed";
import { PollCard } from "~/components/PollCard";
import { ServerTag } from "~/components/ServerTag";
import { UserName } from "~/components/UserName";
import { UserProfilePopover } from "~/components/UserProfilePopover";
import { formatTime, formatTimestamp } from "~/lib/format";
import { carregarFonte, familiaDaFonte } from "~/lib/cosmeticos/fontes";
import { cn } from "~/lib/utils";
import { useEdicaoStore } from "~/stores/edicao-store";
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
import { useReplyStore } from "~/stores/reply-store";
import { useSuperReacao } from "~/stores/super-reacao";
import { ExpressionPicker } from "~/components/ExpressionPicker";
import { EncaminharModal } from "~/components/EncaminharModal";
import { useIgnoreStore } from "~/stores/ignore-store";
import { useAparencia } from "~/stores/aparencia";

const QUICK_EMOJIS = ["👍", "🔥", "😂", "❤️", "👀"];

/// O que o item do menu manda. Segurar qualquer atalho ou pílula super-reage
/// com aquele emoji; o menu precisa de um só, e o fogo é o mais "super".
const SUPER_PADRAO = "🔥";

interface MessageItemProps {
  message: PendingMessageModel;
  compact: boolean;
  canDelete: boolean;
  canPin?: boolean;
  isOwn: boolean;
  currentUserId?: string;
  guildId?: string;
  /// a mensagem que esta responde, quando ainda está na lista carregada
  respondida?: PendingMessageModel;
  emojis?: GuildEmoji[];
  enfeites?: EnfeitesDaPessoa;
  mencoes?: ResolverMencoes;
  meMenciona?: boolean;
  /// veio de uma busca ou de "ir para a mensagem": acende por alguns segundos
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
  const confirmar = useConfirmar();

  const ignorado = useIgnoreStore((s) => s.ignorados).includes(message.author.id);
  const mostrarAvatares = useAparencia((s) => s.avatares);
  const mostrarReacoes = useAparencia((s) => s.reacoes);
  const mostrarPrevia = useAparencia((s) => s.previaDeLinks);
  const [revelado, setRevelado] = useState(false);

  const [editing, setEditing] = useState(false);

  /*
    A seta pra cima no campo de escrever deixa um bilhete com o id; a
    mensagem dona dele abre em edição e recolhe o bilhete na mesma hora —
    senão ela reabriria toda vez que a lista remontasse.
  */
  const pedidoDeEdicao = useEdicaoStore((s) => s.pedido);
  const recolherPedido = useEdicaoStore((s) => s.recolher);

  useEffect(() => {
    if (pedidoDeEdicao !== message.id) return;

    setDraft(message.content);
    setEditing(true);
    recolherPedido();

    /*
      Trazer a mensagem à vista, senão o atalho abre uma caixa que ninguém vê.

      Quem aperta a seta costuma estar com a lista rolada — foi assim no teste:
      a edição abriu corretamente e parecia não ter acontecido nada, porque a
      mensagem estava abaixo da dobra. Um atalho que funciona sem dar sinal é
      indistinguível de um que não funciona.
    */
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

  /// Super reação sempre ADICIONA: segurar o clique é o gesto de "manda ver",
  /// e tirar a reação nesse gesto seria o contrário do que se pediu.
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
      deu ? toast.success(aviso) : toast.error("Seu navegador não deixou copiar."),
    );
  };

  /// O link é o mesmo endereço da rota do canal com a mensagem no fim, para o
  /// dia em que der pra abrir direto nela.
  const linkDaMensagem = () =>
    `${window.location.origin}/channels/${guildId ?? "@me"}/${message.channelId}/${message.id}`;

  const marcarNaoLido = () => {
    unreadFromMessage(message.channelId, message.id);
    toast.success("Não lidas a partir daqui.");
  };

  const apagar = () =>
    void confirmar({
      titulo: "Apagar mensagem?",
      descricao: "Ela some para todo mundo do canal. Não dá pra recuperar.",
      acao: "Apagar",
    }).then(({ confirmado }) => confirmado && void deleteMessage(message.id).catch(() => undefined));

  const iniciarResposta = () =>
    responder({
      messageId: message.id,
      channelId: message.channelId,
      autor: message.author.displayName,
      autorId: message.author.id,
    });

  /*
    O rastro de um comando de barra.

    Linha fina, como a de entrada no servidor: não é conversa, é o registro de
    que alguém acionou um bot. Desenhá-la como mensagem normal — com avatar
    grande e ações de responder — daria peso de fala a algo que ninguém
    escreveu para ser lido.
  */
  if (message.tipo === "COMANDO") {
    return (
      <div className="group flex items-center gap-2 px-2 py-1 text-sm text-ink-muted transition hover:bg-hover @sm:gap-3 @sm:px-4">
        <SlashSquare size={16} className="shrink-0 text-ink-faint" />
        <span className="max-w-[8rem] truncate font-medium text-ink @sm:max-w-none">
          {message.author.displayName}
        </span>
        <span className="hidden @xs:inline">usou</span>
        <span className="min-w-0 truncate text-xs text-ink-muted">
          <MessageContent content={message.content} emojis={emojis} mencoes={mencoes} />
        </span>
        <span className="shrink-0 text-xs text-ink-faint">{formatTime(message.createdAt)}</span>

        {/*
          Apagar, e só isso.

          Editar não faz sentido — a linha não foi escrita, foi gerada; e
          responder a ela seria responder ao próprio ato de digitar. Mas
          apagar precisa existir: é uma mensagem sua no canal, e sem o botão
          ela ficaria lá para sempre.
        */}
        {canDelete && (
          <button
            type="button"
            onClick={apagar}
            title="Apagar"
            aria-label="Apagar"
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
      /*
        O aviso de entrada precisa de ar em volta. Com `py-1` e nenhuma margem
        ele colava na mensagem de cima e na de baixo, e a conversa virava um
        bloco só — a linha do sistema se lia como se fosse fala de alguém.

        `my-2` de cada lado, contra os `mt-4` das mensagens normais: fica
        separado o bastante pra ser outra coisa, e discreto o bastante pra não
        virar um anúncio no meio do papo.
      */
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
        meMenciona && "bg-idle/10 shadow-[inset_2px_0_0_var(--color-idle)] hover:bg-idle/15",
        destacada && "bg-brand/15 shadow-[inset_2px_0_0_var(--color-brand)]",
        message.pending && "opacity-60",
        message.failed && "bg-danger/10",
      )}
    >
      {message.replyToId && (
        <Citacao respondida={respondida} emojis={emojis} mencoes={mencoes} />
      )}

      <div className="w-10 shrink-0">
        {compact || !mostrarAvatares ? (
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
              {/*
                `truncate` porque o nome é o único item elástico da linha: sem
                ele, "Mardeson Pereira" quebrava em duas e empurrava a data
                para baixo do avatar.
              */}
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
            {/*
              Na coluna estreita cabe a hora; a data inteira vira o `title`,
              que é onde ela continua ao alcance de quem precisa dela.
            */}
            <span className="shrink-0 text-xs text-ink-faint" title={formatTimestamp(message.createdAt)}>
              <span className="@md:hidden">{formatTime(message.createdAt)}</span>
              <span className="hidden @md:inline">{formatTimestamp(message.createdAt)}</span>
            </span>
            {message.pinnedAt && (
              <span className="flex shrink-0 items-center gap-1 text-[10px] text-ink-faint">
                <Pin size={10} /> fixada
              </span>
            )}
          </div>
        )}

        {ignorado && !revelado ? (
          <p className="my-1 flex items-center gap-2 text-sm italic text-ink-faint">
            Mensagem de alguém que você ignora.
            <button onClick={() => setRevelado(true)} className="not-italic text-brand hover:underline">
              Mostrar
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
              Esc para{" "}
              <button onClick={() => setEditing(false)} className="text-brand hover:underline">
                cancelar
              </button>{" "}
              · Enter para salvar
            </p>
          </div>
        ) : (
          message.content && (
            /*
              `<div>`, nao `<p>`: o bloco de codigo e um painel, e o navegador
              fecha o paragrafo sozinho quando um bloco aparece dentro dele —
              o "(editado)" acabaria fora do texto.
            */
            <div
              className="whitespace-pre-wrap break-words text-ink-muted"
              style={{ fontFamily: familiaDaFonte(message.fonte) ?? undefined }}
            >
              <MessageContent content={message.content} emojis={emojis} mencoes={mencoes} blocos />
              {message.editedAt && <span className="ml-1 text-[10px] text-ink-faint">(editado)</span>}
            </div>
          )
        )}

        {/*
          Os cartões dos links vêm depois do texto e antes de tudo o mais —
          é a ordem do Discord, e é a que faz sentido: o cartão explica uma
          coisa que está escrita ali em cima.
        */}
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
            <RotateCw size={12} /> Não foi enviada. Tentar de novo
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
            /*
              Ela cresce para a ESQUERDA a partir do canto direito. Numa coluna
              de 280px a fileira inteira — cinco emojis mais sete ações — era
              mais larga que a mensagem e escapava por cima da barra lateral.
              Daí o corte por container: cada faixa de largura mostra o que
              cabe, e o resto continua inteiro no menu dos três pontos.
            */
            "group-hover:flex group-focus-within:flex",
            /*
              Com a barra em `hidden`, o gatilho perde as medidas e o Radix
              joga o menu pro canto da tela. Enquanto um dos dois está aberto
              ela fica de pé, mesmo com o mouse já fora da mensagem.
            */
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
              <AcaoDaBarra titulo="Reagir">
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

          <AcaoDaBarra titulo="Responder" onClick={iniciarResposta}>
            <CornerUpLeft size={16} />
          </AcaoDaBarra>

          <AcaoDaBarra titulo="Encaminhar" className="hidden @sm:block" onClick={() => setEncaminhando(true)}>
            <Forward size={16} />
          </AcaoDaBarra>

          {/*
            Com Shift, o que estava no menu dos três pontos vem pra barra —
            é o atalho de quem já sabe onde fica cada coisa.
          */}
          {shift && (
            <>
              <AcaoDaBarra
                titulo={favorita ? "Tirar dos favoritos" : "Favoritar mensagem"}
                onClick={() => alternarFavorita.mutate({ messageId: message.id, favorita })}
                className={cn("hidden @md:block", favorita && "text-brand")}
              >
                <Bookmark size={16} className={favorita ? "fill-current" : undefined} />
              </AcaoDaBarra>

              <AcaoDaBarra titulo="Marcar como não lida" className="hidden @md:block" onClick={marcarNaoLido}>
                <MailOpen size={16} />
              </AcaoDaBarra>

              <AcaoDaBarra
                titulo="Copiar link da mensagem"
                className="hidden @md:block"
                onClick={() => copiar(linkDaMensagem(), "Link copiado.")}
              >
                <Link2 size={16} />
              </AcaoDaBarra>

              <AcaoDaBarra
                titulo="Copiar ID da mensagem"
                className="hidden @md:block"
                onClick={() => copiar(message.id, "ID copiado.")}
              >
                <Hash size={16} />
              </AcaoDaBarra>
            </>
          )}

          {canPin && (
            <AcaoDaBarra
              titulo={message.pinnedAt ? "Desafixar" : "Fixar mensagem"}
              className="hidden @sm:block"
              onClick={() => onPin?.(message, !message.pinnedAt)}
            >
              {message.pinnedAt ? <PinOff size={16} /> : <Pin size={16} />}
            </AcaoDaBarra>
          )}

          {isOwn && (
            <AcaoDaBarra
              titulo="Editar"
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
            <AcaoDaBarra titulo="Apagar" onClick={apagar} className="hidden hover:text-danger @sm:block">
              <Trash2 size={16} />
            </AcaoDaBarra>
          )}

          <DropdownMenu open={menuAberto} onOpenChange={setMenuAberto}>
            <DropdownMenuTrigger asChild>
              <AcaoDaBarra titulo="Mais">
                <MoreHorizontal size={16} />
              </AcaoDaBarra>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuItem onSelect={iniciarResposta}>
                Responder <CornerUpLeft size={16} />
              </DropdownMenuItem>

              <DropdownMenuItem onSelect={() => setEncaminhando(true)}>
                Encaminhar <Forward size={16} />
              </DropdownMenuItem>

              {mostrarReacoes && (
                <>
                  <DropdownMenuItem onSelect={() => setReagindo(true)}>
                    Adicionar reação <SmilePlus size={16} />
                  </DropdownMenuItem>

                  <DropdownMenuItem onSelect={() => superReagir(SUPER_PADRAO)}>
                    Super reagir com {SUPER_PADRAO} <Sparkles size={16} />
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />

              {canPin && (
                <DropdownMenuItem onSelect={() => onPin?.(message, !message.pinnedAt)}>
                  {message.pinnedAt ? "Desafixar mensagem" : "Fixar mensagem"}
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
                  Editar mensagem <Pencil size={16} />
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onSelect={() => alternarFavorita.mutate({ messageId: message.id, favorita })}
              >
                {favorita ? "Tirar dos favoritos" : "Favoritar mensagem"}
                <Bookmark size={16} className={favorita ? "fill-current text-brand" : undefined} />
              </DropdownMenuItem>

              <DropdownMenuItem onSelect={marcarNaoLido}>
                Marcar como não lida <MailOpen size={16} />
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onSelect={() => copiar(linkDaMensagem(), "Link copiado.")}>
                Copiar link da mensagem <Link2 size={16} />
              </DropdownMenuItem>

              <DropdownMenuItem onSelect={() => copiar(message.id, "ID copiado.")}>
                Copiar ID da mensagem <Copy size={16} />
              </DropdownMenuItem>

              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={apagar} className="text-danger focus:text-danger">
                    Apagar mensagem <Trash2 size={16} />
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

/**
 * A reação guarda texto: o caractere, para os nativos, e `:nome:` para os do
 * servidor. Sem isto a pílula de um emoji do servidor mostrava `:nome:` cru.
 *
 * Se o emoji não estiver mais no servidor (ou for de outro), o `:nome:` fica
 * à mostra de propósito — é mais honesto que um quadrado vazio.
 */
const EmojiDaReacao: React.FC<{ emoji: string; doServidor: GuildEmoji[] }> = ({
  emoji,
  doServidor,
}) => {
  const nome = /^:([\w~-]+):$/.exec(emoji)?.[1];
  const achado = nome ? doServidor.find((e) => e.name === nome) : undefined;

  if (!achado) return <span>{emoji}</span>;

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

/// Clique reage; clique segurado super-reage. O `title` conta o gesto, que
/// ninguém adivinha sozinho.
const AtalhoDeReacao: React.FC<{
  emoji: string;
  className?: string;
  onReagir: () => void;
  onSuper: () => void;
}> = ({ emoji, className, onReagir, onSuper }) => (
  <button
    {...useSegurar(onReagir, onSuper)}
    title={`Reagir com ${emoji} — segure para super reagir`}
    className={cn("rounded px-1.5 py-1 text-base hover:bg-surface-3", className)}
  >
    {emoji}
  </button>
);

const PilulaDeReacao: React.FC<{
  reaction: Message["reactions"][number];
  emojis: GuildEmoji[];
  onReagir: () => void;
  onSuper: () => void;
}> = ({ reaction, emojis, onReagir, onSuper }) => (
  <button
    {...useSegurar(onReagir, onSuper)}
    title={`${reaction.emoji} — segure para super reagir`}
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

/**
 * A linha de citação acima de uma resposta. Uma linha, sempre: ela resume o
 * que está sendo respondido, não repete a mensagem.
 *
 * A mensagem é um flex de avatar + conteúdo, e a citação é mais um filho
 * dele: sem o `w-full` (com `flex-wrap` na raiz) ela virava uma terceira
 * coluna e empurrava o avatar pro lado.
 */
const Citacao: React.FC<{
  respondida?: PendingMessageModel;
  emojis: GuildEmoji[];
  mencoes?: ResolverMencoes;
}> = ({ respondida, emojis, mencoes }) => (
  <div className="mb-0.5 flex h-5 w-full items-center gap-1.5 overflow-hidden pl-14 text-xs text-ink-faint @sm:pl-18">
    <CornerUpLeft size={12} className="shrink-0 -scale-y-100" />

    {respondida ? (
      <>
        <Avatar
          id={respondida.author.id}
          name={respondida.author.displayName}
          url={respondida.author.avatarUrl}
          size={16}
        />
        <span className="max-w-[7rem] shrink-0 truncate font-medium text-ink-muted @sm:max-w-[12rem]">
          {respondida.author.displayName}
        </span>
        {/*
          O conteúdo pode trazer imagem ou GIF, que o MessageContent desenha
          em tamanho cheio — numa citação isso virava um bloco de 300px de
          altura. Aqui tudo é achatado à altura da linha.
        */}
        <span className="min-w-0 truncate [&_img]:inline-block [&_img]:size-4 [&_img]:align-text-bottom">
          {respondida.content ? (
            <MessageContent content={respondida.content} emojis={emojis} mencoes={mencoes} />
          ) : (
            "clique para ver o anexo"
          )}
        </span>
      </>
    ) : (
      <span className="italic">A mensagem original não está mais aqui.</span>
    )}
  </div>
);
