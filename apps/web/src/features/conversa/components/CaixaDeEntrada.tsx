import React, { useState } from "react";
import { useNavigate } from "react-router";
import { At, Bell, BookmarkSimple, Confetti, Hash, Tray } from "@phosphor-icons/react";

import { useFindMentions } from "~/@core/application/queries/message/use-find-mentions";
import { useReadStatesList } from "~/@core/application/queries/message/use-read-states";
import {
  useFavoriteMessages,
  useToggleFavoriteMessage,
} from "~/@core/application/queries/message/use-message-favorites";
import { Avatar } from "~/features/perfil/components/Avatar";
import { MessageContent } from "~/features/conversa/components/MessageContent";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Tooltip } from "~/components/ui/tooltip";
import { formatTimestamp } from "~/lib/format";
import { cn } from "~/lib/utils";
import { flxCls } from "~/lib/compat-de-tema";
import { useTranslation } from "~/traducao";

type Tab = "nao-lidas" | "salvas" | "mencoes";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "nao-lidas", label: "conversa.entrada.naoLidas", icon: <Bell data-gc="conversa.caixa-de-entrada.bell" size={16} weight="fill" /> },
  { id: "salvas", label: "conversa.entrada.salvas", icon: <BookmarkSimple data-gc="conversa.caixa-de-entrada.bookmark-simple" size={16} weight="fill" /> },
  { id: "mencoes", label: "conversa.entrada.mencoes", icon: <At data-gc="conversa.caixa-de-entrada.at" size={16} weight="bold" /> },
];

export const EntryBox: React.FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("nao-lidas");

  const { data: states = [] } = useReadStatesList(isOpen);
  const notRead = states.filter((state) => state.unreadCount > 0);

  return (
    <Popover data-gc="conversa.caixa-de-entrada.popover.set-is-open" open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger data-gc="conversa.caixa-de-entrada.popover-trigger" asChild>
        <button data-gc="conversa.caixa-de-entrada.button" aria-label={t("conversa.entrada.titulo")} className="relative text-ink-muted transition hover:text-ink">
          <Tooltip data-gc="conversa.caixa-de-entrada.tooltip" label={t("conversa.entrada.titulo")}>
            <Tray data-gc="conversa.caixa-de-entrada.tray" size={20} weight="fill" />
          </Tooltip>

          {notRead.length > 0 && (
            <span data-gc="conversa.caixa-de-entrada.span" className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-danger" />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent data-gc="conversa.caixa-de-entrada.popover-content" align="end" className={cn("flex h-[min(30rem,72svh)] w-[min(26rem,92vw)] gap-0 p-0", flxCls("entryBox"))}>
        <nav data-gc="conversa.caixa-de-entrada.nav" className={cn("flex w-12 shrink-0 flex-col items-center gap-1 border-r border-divisor py-2", flxCls("boxEntrySide"))}>
          {TABS.map((item) => (
            <Tooltip data-gc="conversa.caixa-de-entrada.tooltip--2" key={item.id} label={t(item.label)} side="left">
              <button data-gc="conversa.caixa-de-entrada.button--2"
                onClick={() => setTab(item.id)}
                aria-label={t(item.label)}
                aria-current={tab === item.id}
                className={cn(
                  "rounded-lg p-2 transition",
                  tab === item.id
                    ? "bg-selecionado text-ink"
                    : "text-ink-faint hover:bg-hover hover:text-ink",
                )}
              >
                {item.icon}
              </button>
            </Tooltip>
          ))}
        </nav>

        <div data-gc="conversa.caixa-de-entrada.div" className="min-w-0 flex-1 overflow-y-auto">
          {tab === "nao-lidas" && <NotRead data-gc="conversa.caixa-de-entrada.not-read" states={notRead} onIr={() => setIsOpen(false)} />}
          {tab === "salvas" && <Saved data-gc="conversa.caixa-de-entrada.saved" active={isOpen} />}
          {tab === "mencoes" && <Mentions data-gc="conversa.caixa-de-entrada.mentions" active={isOpen} onIr={() => setIsOpen(false)} />}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const Empty: React.FC<{ icon: React.ReactNode; title: string; detail: string }> = ({
  icon,
  title,
  detail,
}) => (
  <div data-gc="conversa.caixa-de-entrada.div--2" className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
    <span data-gc="conversa.caixa-de-entrada.span--2" className="text-ink-faint/60">{icon}</span>
    <p data-gc="conversa.caixa-de-entrada.p" className="text-sm font-semibold">{title}</p>
    <p data-gc="conversa.caixa-de-entrada.p--2" className="text-xs leading-relaxed text-ink-muted">{detail}</p>
  </div>
);

const NotRead: React.FC<{
  states: { channelId: string; guildId: string | null; channelName?: string | null; unreadCount: number; mentionCount: number }[];
  onIr: () => void;
}> = ({ states, onIr }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!states.length) {
    return (
      <Empty data-gc="conversa.caixa-de-entrada.empty"
        icon={<Confetti data-gc="conversa.caixa-de-entrada.confetti" size={40} />}
        title={t("conversa.entrada.fimTitulo")}
        detail={t("conversa.entrada.fimDetalhe")}
      />
    );
  }

  return (
    <div data-gc="conversa.caixa-de-entrada.div--3" className="p-2">
      {states.map((state) => (
        <button data-gc="conversa.caixa-de-entrada.button--3"
          key={state.channelId}
          onClick={() => {
            navigate(
              state.guildId
                ? `/channels/${state.guildId}/${state.channelId}`
                : `/dm/${state.channelId}`,
            );
            onIr();
          }}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-hover"
        >
          <Hash data-gc="conversa.caixa-de-entrada.hash" size={16} weight="bold" className="shrink-0 text-ink-faint" />
          <span data-gc="conversa.caixa-de-entrada.span--3" className="min-w-0 flex-1 truncate text-sm">
            {state.channelName ?? t("conversa.entrada.semNome")}
          </span>

          {state.mentionCount > 0 && (
            <span data-gc="conversa.caixa-de-entrada.span--4" className="shrink-0 rounded-full bg-danger px-1.5 text-xs font-semibold text-sobre-marca">
              {state.mentionCount}
            </span>
          )}
          <span data-gc="conversa.caixa-de-entrada.span--5" className="shrink-0 text-xs text-ink-faint">{state.unreadCount}</span>
        </button>
      ))}
    </div>
  );
};

const Saved: React.FC<{ active: boolean }> = ({ active }) => {
  const { t } = useTranslation();
  const { data: favorites = [], isLoading } = useFavoriteMessages(active);
  const toggle = useToggleFavoriteMessage();

  if (isLoading) return <p data-gc="conversa.caixa-de-entrada.p--3" className="p-6 text-center text-sm text-ink-faint">{t("comum.carregando")}</p>;

  if (!favorites.length) {
    return (
      <Empty data-gc="conversa.caixa-de-entrada.empty--2"
        icon={<BookmarkSimple data-gc="conversa.caixa-de-entrada.bookmark-simple--2" size={40} />}
        title={t("conversa.entrada.semSalvosTitulo")}
        detail={t("conversa.entrada.semSalvosDetalhe")}
      />
    );
  }

  return (
    <div data-gc="conversa.caixa-de-entrada.div--4">
      {favorites.map((message) => (
        <article data-gc="conversa.caixa-de-entrada.article" key={message.id} className="group flex gap-3 border-b border-divisor px-3 py-3">
          <Avatar data-gc="conversa.caixa-de-entrada.avatar"
            id={message.author.id}
            name={message.author.displayName}
            url={message.author.avatarUrl}
            size={32}
          />

          <div data-gc="conversa.caixa-de-entrada.div--5" className="min-w-0 flex-1">
            <p data-gc="conversa.caixa-de-entrada.p--4" className={cn(flxCls("boxEntryTop"), "flex items-baseline gap-2")}>
              <span data-gc="conversa.caixa-de-entrada.span--6" className="truncate text-sm font-semibold">{message.author.displayName}</span>
              <span data-gc="conversa.caixa-de-entrada.span--7" className="shrink-0 text-xs text-ink-faint">
                {formatTimestamp(message.createdAt)}
              </span>
            </p>

            <p data-gc="conversa.caixa-de-entrada.p--5" className="mt-0.5 line-clamp-3 whitespace-pre-wrap break-words text-sm text-ink-muted [&_img]:inline-block [&_img]:size-4 [&_img]:align-text-bottom">
              {message.content ? (
                <MessageContent data-gc="conversa.caixa-de-entrada.message-content" content={message.content} emojis={[]} />
              ) : (
                t("conversa.entrada.anexo")
              )}
            </p>
          </div>

          <button data-gc="conversa.caixa-de-entrada.button--4"
            onClick={() => toggle.mutate({ messageId: message.id, favorite: true })}
            aria-label={t("conversa.entrada.tirarDosSalvos")}
            className={cn(
              flxCls("topBoxEntryButton"),
              "h-fit rounded p-1 text-ink-faint opacity-0 transition hover:text-danger group-hover:opacity-100",
            )}
          >
            <BookmarkSimple data-gc="conversa.caixa-de-entrada.bookmark-simple--3" size={16} weight="fill" className="text-danger" />
          </button>
        </article>
      ))}
    </div>
  );
};

const Mentions: React.FC<{ active: boolean; onIr: () => void }> = ({ active, onIr }) => {
  const { t } = useTranslation();
  const { data: mentions = [], isLoading } = useFindMentions(active);
  const navigate = useNavigate();

  if (isLoading) return <p data-gc="conversa.caixa-de-entrada.p--6" className="p-6 text-center text-sm text-ink-faint">{t("comum.carregando")}</p>;

  if (!mentions.length) {
    return (
      <Empty data-gc="conversa.caixa-de-entrada.empty--3"
        icon={<At data-gc="conversa.caixa-de-entrada.at--2" size={40} />}
        title={t("conversa.entrada.semMencoesTitulo")}
        detail={t("conversa.entrada.semMencoesDetalhe")}
      />
    );
  }

  return (
    <div data-gc="conversa.caixa-de-entrada.div--6">
      {mentions.map((mention) => (
        <button data-gc="conversa.caixa-de-entrada.button--5"
          key={mention.id}
          onClick={() => {
            navigate(
              mention.channel.guildId
                ? `/channels/${mention.channel.guildId}/${mention.channel.id}`
                : `/dm/${mention.channel.id}`,
            );
            onIr();
          }}
          className="flex w-full gap-3 border-b border-divisor px-3 py-3 text-left transition hover:bg-hover"
        >
          <Avatar data-gc="conversa.caixa-de-entrada.avatar--2"
            id={mention.author.id}
            name={mention.author.displayName}
            url={mention.author.avatarUrl}
            size={32}
          />

          <div data-gc="conversa.caixa-de-entrada.div--7" className="min-w-0 flex-1">
            <p data-gc="conversa.caixa-de-entrada.p--7" className="flex items-baseline gap-2">
              <span data-gc="conversa.caixa-de-entrada.span--8" className="truncate text-sm font-semibold">{mention.author.displayName}</span>
              <span data-gc="conversa.caixa-de-entrada.span--9" className="shrink-0 text-xs text-ink-faint">
                {formatTimestamp(mention.createdAt)}
              </span>
            </p>

            <p data-gc="conversa.caixa-de-entrada.p--8" className="flex items-center gap-1 text-xs text-ink-faint">
              <Hash data-gc="conversa.caixa-de-entrada.hash--2" size={11} weight="bold" className="shrink-0" />
              {mention.channel.name}
            </p>

            <p data-gc="conversa.caixa-de-entrada.p--9" className="mt-0.5 line-clamp-3 whitespace-pre-wrap break-words text-sm text-ink-muted [&_img]:inline-block [&_img]:size-4 [&_img]:align-text-bottom">
              {mention.content ? <MessageContent data-gc="conversa.caixa-de-entrada.message-content--2" content={mention.content} emojis={[]} /> : t("conversa.entrada.anexo")}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
};
