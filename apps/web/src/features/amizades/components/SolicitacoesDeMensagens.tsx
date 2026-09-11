import React, { useState } from "react";
import { Envelope, List, ShieldWarning } from "@phosphor-icons/react";
import type { DmRequest } from "@gravae/shared";

import { useDmRequests } from "~/@core/application/queries/friend/use-pedidos-de-dm";
import { useDmReplyRequest } from "~/@core/application/queries/friend/use-responder-pedido-de-dm";
import { Avatar } from "~/features/perfil/components/Avatar";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

type Tab = "pedidos" | "spam";

export const MessagesRequests: React.FC<{ onOpenMenu?: () => void }> = ({ onOpenMenu }) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("pedidos");
  const { data, isLoading } = useDmRequests(true);

  const requests = data?.requests ?? [];
  const spam = data?.spam ?? [];
  const list = tab === "pedidos" ? requests : spam;

  return (
    <div data-gc="amizades.solicitacoes-de-mensagens.div" className="topo-do-miolo flex min-h-0 flex-1 flex-col bg-surface-0">
      <header data-gc="amizades.solicitacoes-de-mensagens.header" className="regiao-de-arrasto flex h-[var(--layout-header-height)] shrink-0 items-center gap-2 overflow-x-auto border-b border-line px-4 sm:gap-3">
        {onOpenMenu && (
          <button data-gc="amizades.solicitacoes-de-mensagens.button.on-open-menu"
            onClick={onOpenMenu}
            aria-label={t("amizades.abrirMenu")}
            className="-ml-1 shrink-0 rounded p-1.5 text-ink-muted transition hover:bg-surface-3 hover:text-ink md:hidden"
          >
            <List data-gc="amizades.solicitacoes-de-mensagens.list" size={20} />
          </button>
        )}

        <span data-gc="amizades.solicitacoes-de-mensagens.span" className="flex shrink-0 items-center gap-2 font-semibold">
          <Envelope data-gc="amizades.solicitacoes-de-mensagens.envelope" size={18} weight="fill" className="text-ink-faint" />
          {t("amizades.solicitacoes")}
        </span>

        <span data-gc="amizades.solicitacoes-de-mensagens.span--2" aria-hidden className="text-ink-faint">
          •
        </span>

        <nav data-gc="amizades.solicitacoes-de-mensagens.nav" className="flex items-center gap-1">
          <TabButton data-gc="amizades.solicitacoes-de-mensagens.tab-button" active={tab === "pedidos"} onClick={() => setTab("pedidos")}>
            {t("amizades.pedidos")}
          </TabButton>
          <TabButton data-gc="amizades.solicitacoes-de-mensagens.tab-button--2" active={tab === "spam"} onClick={() => setTab("spam")}>
            {t("amizades.spam")}
            {spam.length > 0 ? ` (${spam.length})` : ""}
          </TabButton>
        </nav>
      </header>

      <div data-gc="amizades.solicitacoes-de-mensagens.div--2" className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <p data-gc="amizades.solicitacoes-de-mensagens.p" className="text-sm text-ink-faint">{t("comum.carregando")}</p>
        ) : list.length === 0 ? (
          <Empty data-gc="amizades.solicitacoes-de-mensagens.empty" tab={tab} />
        ) : (
          <>
            <p data-gc="amizades.solicitacoes-de-mensagens.p--2" className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              {tab === "pedidos" ? t("amizades.pedidosPendentes") : t("amizades.marcadosComoSpam")} — {list.length}
            </p>

            <ul data-gc="amizades.solicitacoes-de-mensagens.ul" className="space-y-px">
              {list.map((request) => (
                <AppRequest data-gc="amizades.solicitacoes-de-mensagens.app-request" key={request.channelId} request={request} />
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button data-gc="amizades.solicitacoes-de-mensagens.button.on-click"
    onClick={onClick}
    className={cn(
      "rounded px-2 py-1 text-sm font-medium transition",
      active ? "bg-selecionado text-ink" : "text-ink-muted hover:bg-hover hover:text-ink",
    )}
  >
    {children}
  </button>
);

const Empty: React.FC<{ tab: Tab }> = ({ tab }) => {
  const { t } = useTranslation();

  return (
  <div data-gc="amizades.solicitacoes-de-mensagens.div--3" className="flex flex-col items-center justify-center gap-2 py-24 text-center">
    {tab === "pedidos" ? (
      <Envelope data-gc="amizades.solicitacoes-de-mensagens.envelope--2" size={40} className="text-ink-faint/60" />
    ) : (
      <ShieldWarning data-gc="amizades.solicitacoes-de-mensagens.shield-warning" size={40} className="text-ink-faint/60" />
    )}

    <p data-gc="amizades.solicitacoes-de-mensagens.p--3" className="text-sm font-semibold">
      {tab === "pedidos" ? t("amizades.semPedidos") : t("amizades.semSpam")}
    </p>
    <p data-gc="amizades.solicitacoes-de-mensagens.p--4" className="max-w-sm text-xs leading-relaxed text-ink-muted">
      {tab === "pedidos" ? t("amizades.semPedidosDetalhe") : t("amizades.semSpamDetalhe")}
    </p>
  </div>
  );
};

const AppRequest: React.FC<{ request: DmRequest }> = ({ request }) => {
  const { t } = useTranslation();
  const reply = useDmReplyRequest();

  const replyWith = (action: "aceitar" | "ignorar" | "spam") =>
    reply.mutate({ channelId: request.channelId, action });

  return (
    <li data-gc="amizades.solicitacoes-de-mensagens.li" className="flex items-center gap-3 rounded-lg px-2 py-3 transition hover:bg-hover">
      <Avatar data-gc="amizades.solicitacoes-de-mensagens.avatar"
        id={request.de.id}
        name={request.de.displayName}
        url={request.de.avatarUrl}
        size={40}
      />

      <div data-gc="amizades.solicitacoes-de-mensagens.div--4" className="min-w-0 flex-1">
        <p data-gc="amizades.solicitacoes-de-mensagens.p--5" className="flex items-baseline gap-1.5">
          <span data-gc="amizades.solicitacoes-de-mensagens.span--3" className="truncate text-sm font-semibold">{request.de.displayName}</span>
          <span data-gc="amizades.solicitacoes-de-mensagens.span--4" className="truncate text-xs text-ink-faint">{request.de.username}</span>
        </p>

        <p data-gc="amizades.solicitacoes-de-mensagens.p--6" className="truncate text-xs text-ink-muted">
          {request.serversCommon === 0
            ? t("amizades.semServidoresEmComum")
            : request.serversCommon === 1
              ? t("amizades.umServidorEmComum")
              : t("amizades.servidoresEmComum", { quantos: request.serversCommon })}
          {request.preview ? ` — ${request.preview}` : ""}
        </p>
      </div>

      <div data-gc="amizades.solicitacoes-de-mensagens.div--5" className="flex shrink-0 gap-2">
        <Button data-gc="amizades.solicitacoes-de-mensagens.button"
          variant="surface"
          size="sm"
          disabled={reply.isPending}
          onClick={() => replyWith(request.spam ? "ignorar" : "spam")}
        >
          {request.spam ? t("amizades.ignorar") : t("amizades.marcarSpam")}
        </Button>

        <Button data-gc="amizades.solicitacoes-de-mensagens.button--2" size="sm" disabled={reply.isPending} onClick={() => replyWith("aceitar")}>
          {t("amizades.aceitar")}
        </Button>
      </div>
    </li>
  );
};
