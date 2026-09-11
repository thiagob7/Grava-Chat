import React, { useMemo, useState } from "react";
import { Mail, Phone, Plus, Search, Users, Volume2 } from "lucide-react";

import { useFindDms } from "~/@core/application/queries/friend/use-find-dms";
import { useFindFriends } from "~/@core/application/queries/friend/use-find-friends";
import { useActive } from "~/@core/application/queries/friend/use-ativos";
import { useDmRequests } from "~/@core/application/queries/friend/use-pedidos-de-dm";
import { useVoiceStore } from "~/features/voz/stores/voice-store";
import { chatStatus } from "~/features/amizades/lib/status-da-conversa";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { Avatar } from "~/features/perfil/components/Avatar";
import { UserName } from "~/features/perfil/components/UserName";
import { NewChatModal } from "~/features/amizades/components/NovaConversaModal";
import { Tooltip } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import { flx, flxAttr } from "~/lib/compat-de-tema";
import { flxCls } from "~/lib/compat-de-tema";
import { useTranslation } from "~/traducao";

interface DmSidebarProps {
  activeChannelId: string | undefined;
  readStates: Record<string, { read: string | null; notRead: number }>;
  user: SelfUserModel;
  onOpenFriends: () => void;
  onOpenRequests: () => void;
  requestsIsOpen: boolean;
  onSelectDm: (channelId: string) => void;
  width: number;
  fluid?: boolean;
}

export const DmSidebar: React.FC<DmSidebarProps> = ({
  activeChannelId,
  readStates,
  user,
  onOpenFriends,
  onOpenRequests,
  requestsIsOpen,
  onSelectDm,
  width,
  fluid = false,
}) => {
  const { t } = useTranslation();
  const { data: dms = [] } = useFindDms(true);
  const { data: relations = [] } = useFindFriends(true);

  const { data: requestsBox } = useDmRequests(true);
  const { data: actives = [] } = useActive();
  const inVoice = new Set(actives.map((a) => a.user.id));

  const channelCall = useVoiceStore((s) => s.channelId);
  const [creatingChat, setCreatingChat] = useState(false);

  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return dms;

    return dms.filter(
      (dm) =>
        dm.user.displayName.toLowerCase().includes(term) ||
        dm.user.username.toLowerCase().includes(term),
    );
  }, [dms, search]);

  const requestsReceived = relations.filter((r) => r.status === "PENDING_IN").length;
  const pendingRequests = requestsBox?.requests.length ?? 0;

  return (
    <aside data-gc="amizades.dm-sidebar.aside"
      {...flxAttr("chatsColumn")}
      className={cn(
        "group/coluna canto-do-miolo topo-do-miolo relative flex flex-col bg-surface-1",
        fluid ? "min-w-0 flex-1" : "shrink-0",
      )}
      style={fluid ? undefined : { width: width }}
    >
      <div data-gc="amizades.dm-sidebar.div" aria-hidden {...flx("sideDivider", "absolute inset-y-0 right-0 w-px bg-transparent")} />
      <div data-gc="amizades.dm-sidebar.div--2" {...flx("listChats", cn("lista-de-conversas miolo-recortado flex min-h-0 flex-1 flex-col", flxCls("listChatsPanel")))}>
      <header data-gc="amizades.dm-sidebar.header" className={cn("regiao-de-arrasto flex h-[var(--layout-header-height)] items-center border-b border-divisor px-4 shadow-sm", flxCls("listChatsTop"))}>
        <h1 data-gc="amizades.dm-sidebar.h1" className="truncate font-semibold">{t("amizades.mensagensDiretas")}</h1>
      </header>

      <div data-gc="amizades.dm-sidebar.div--3" className="relative flex min-h-0 flex-1 flex-col">
      <div data-gc="amizades.dm-sidebar.div--4" {...flx("chatsScroller", "flex-1 overflow-y-auto px-2 py-3")}>
        <div data-gc="amizades.dm-sidebar.div--5" className="relative mb-3">
          <Search data-gc="amizades.dm-sidebar.search" size={14} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input data-gc="amizades.dm-sidebar.input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("amizades.encontreConversa")}
            aria-label={t("amizades.encontreConversa")}
            className="w-full rounded bg-surface-0 py-1.5 pl-7 pr-2 text-sm outline-none placeholder:text-ink-faint focus:ring-1 focus:ring-brand"
          />
        </div>

        <button data-gc="amizades.dm-sidebar.button.on-open-friends"
          onClick={onOpenFriends}
          className={cn(
            "mb-0.5 flex w-full items-center gap-3 rounded-lg border border-transparent px-2 py-2 text-sm font-medium transition",
            activeChannelId || requestsIsOpen
              ? "text-ink-muted hover:bg-surface-3 hover:text-ink"
              : "bg-selecionado text-ink",
          )}
        >
          <Users data-gc="amizades.dm-sidebar.users" size={20} className="text-ink-faint" />
          {t("amizades.amigos")}
          {requestsReceived > 0 && (
            <span data-gc="amizades.dm-sidebar.span" className="ml-auto rounded-full bg-danger px-1.5 text-xs font-semibold text-sobre-marca">
              {requestsReceived}
            </span>
          )}
        </button>

        <button data-gc="amizades.dm-sidebar.button.on-open-requests"
          onClick={onOpenRequests}
          className={cn(
            "mb-3 flex w-full items-center gap-3 rounded-lg border border-transparent px-2 py-2 text-sm font-medium transition",
            requestsIsOpen
              ? "bg-selecionado text-ink"
              : "text-ink-muted hover:bg-surface-3 hover:text-ink",
          )}
        >
          <Mail data-gc="amizades.dm-sidebar.mail" size={20} className="text-ink-faint" />
          {t("amizades.solicitacoes")}
          {pendingRequests > 0 && (
            <span data-gc="amizades.dm-sidebar.span--2" className="ml-auto rounded-full bg-danger px-1.5 text-xs font-semibold text-sobre-marca">
              {pendingRequests}
            </span>
          )}
        </button>

        <div data-gc="amizades.dm-sidebar.div--6" className="mb-1 mt-2 flex items-center gap-1 border-t border-line pl-2 pr-1 pt-3">
          <h2 data-gc="amizades.dm-sidebar.h2" className="min-w-0 flex-1 truncate text-xs font-semibold uppercase tracking-wide text-ink-faint">
            {t("amizades.mensagensDiretas")}
          </h2>

          <Tooltip data-gc="amizades.dm-sidebar.tooltip" label={t("amizades.nova.titulo")}>
            <button data-gc="amizades.dm-sidebar.button"
              type="button"
              onClick={() => setCreatingChat(true)}
              aria-label={t("amizades.nova.titulo")}
              className="shrink-0 rounded p-0.5 text-ink-faint transition hover:text-ink"
            >
              <Plus data-gc="amizades.dm-sidebar.plus" size={16} />
            </button>
          </Tooltip>
        </div>

        {visible.length === 0 && !search && (
          <p data-gc="amizades.dm-sidebar.p" className="px-2 py-1 text-xs text-ink-faint">
            {t("amizades.semConversas")}
          </p>
        )}

        {visible.length === 0 && search && (
          <p data-gc="amizades.dm-sidebar.p--2" className="px-2 py-1 text-xs text-ink-faint">{t("amizades.semConversaComEsseNome")}</p>
        )}

        {visible.map((dm) => {
          const active = dm.id === activeChannelId;
          const notRead = !active && dm.lastMessageId && dm.lastMessageId !== readStates[dm.id]?.read;

          return (
            <button data-gc="amizades.dm-sidebar.button--2"
              key={dm.id}
              onClick={() => onSelectDm(dm.id)}
              className={cn(
                "mb-0.5 flex w-full items-center gap-2.5 rounded-lg border border-transparent px-2 py-1.5 text-sm transition",
                flxCls("chatItem"),
                active
                  ? cn("bg-selecionado text-ink", flxCls("chatActiveItem"))
                  : notRead
                    ? "font-semibold text-ink hover:bg-surface-3"
                    : "text-ink-muted hover:bg-surface-3",
              )}
            >
              <Avatar data-gc="amizades.dm-sidebar.avatar"
                id={dm.user.id}
                name={dm.user.displayName}
                url={dm.user.avatarUrl}
                size={32}
                status={dm.user.status}
              />
              <span data-gc="amizades.dm-sidebar.span--3" className="min-w-0 flex-1 text-left">
                <span data-gc="amizades.dm-sidebar.span--4" className="block truncate">
                  <UserName data-gc="amizades.dm-sidebar.user-name" name={dm.user.displayName} isBot={dm.user.isBot} isSystem={dm.user.system} seal="sm" />
                </span>

                {(() => {
                  const status = chatStatus({
                    inCallWithMe: channelCall === dm.id,
                    inVoiceServer: inVoice.has(dm.user.id),
                  });

                  if (!status) return null;

                  return (
                    <span data-gc="amizades.dm-sidebar.span--5" className="flex items-center gap-1 truncate text-xs font-normal text-ink-faint">
                      {status.kind === "chamada" ? (
                        <Phone data-gc="amizades.dm-sidebar.phone" size={11} className="shrink-0 text-online" />
                      ) : (
                        <Volume2 data-gc="amizades.dm-sidebar.volume2" size={11} className="shrink-0 text-online" />
                      )}
                      {t(status.key)}
                    </span>
                  );
                })()}
              </span>

              {notRead && <span data-gc="amizades.dm-sidebar.span--6" className="ml-auto size-2 shrink-0 rounded-full bg-ink" />}
            </button>
          );
        })}
      </div>

      </div>
      </div>

      <NewChatModal data-gc="amizades.dm-sidebar.new-chat-modal.on-select-dm"
        isOpen={creatingChat}
        onClose={() => setCreatingChat(false)}
        onOpenChat={onSelectDm}
      />
    </aside>
  );
};
