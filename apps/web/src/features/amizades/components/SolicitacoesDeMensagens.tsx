import React, { useState } from "react";
import { Envelope, List, ShieldWarning } from "@phosphor-icons/react";
import type { PedidoDeDm } from "@gravae/shared";

import { usePedidosDeDm } from "~/@core/application/queries/friend/use-pedidos-de-dm";
import { useResponderPedidoDeDm } from "~/@core/application/queries/friend/use-responder-pedido-de-dm";
import { Avatar } from "~/features/perfil/components/Avatar";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

type Aba = "pedidos" | "spam";

export const SolicitacoesDeMensagens: React.FC<{ onAbrirMenu?: () => void }> = ({ onAbrirMenu }) => {
  const { t } = useTranslation();
  const [aba, setAba] = useState<Aba>("pedidos");
  const { data, isLoading } = usePedidosDeDm(true);

  const pedidos = data?.pedidos ?? [];
  const spam = data?.spam ?? [];
  const lista = aba === "pedidos" ? pedidos : spam;

  return (
    <div data-gc="amizades.solicitacoes-de-mensagens.div" className="topo-do-miolo flex min-h-0 flex-1 flex-col bg-surface-0">
      <header data-gc="amizades.solicitacoes-de-mensagens.header" className="regiao-de-arrasto flex h-[var(--layout-header-height)] shrink-0 items-center gap-2 overflow-x-auto border-b border-line px-4 sm:gap-3">
        {onAbrirMenu && (
          <button data-gc="amizades.solicitacoes-de-mensagens.button.on-abrir-menu"
            onClick={onAbrirMenu}
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
          <BotaoDeAba data-gc="amizades.solicitacoes-de-mensagens.botao-de-aba" ativa={aba === "pedidos"} onClick={() => setAba("pedidos")}>
            {t("amizades.pedidos")}
          </BotaoDeAba>
          <BotaoDeAba data-gc="amizades.solicitacoes-de-mensagens.botao-de-aba--2" ativa={aba === "spam"} onClick={() => setAba("spam")}>
            {t("amizades.spam")}
            {spam.length > 0 ? ` (${spam.length})` : ""}
          </BotaoDeAba>
        </nav>
      </header>

      <div data-gc="amizades.solicitacoes-de-mensagens.div--2" className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <p data-gc="amizades.solicitacoes-de-mensagens.p" className="text-sm text-ink-faint">{t("comum.carregando")}</p>
        ) : lista.length === 0 ? (
          <Vazio data-gc="amizades.solicitacoes-de-mensagens.vazio" aba={aba} />
        ) : (
          <>
            <p data-gc="amizades.solicitacoes-de-mensagens.p--2" className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              {aba === "pedidos" ? t("amizades.pedidosPendentes") : t("amizades.marcadosComoSpam")} — {lista.length}
            </p>

            <ul data-gc="amizades.solicitacoes-de-mensagens.ul" className="space-y-px">
              {lista.map((pedido) => (
                <Pedido data-gc="amizades.solicitacoes-de-mensagens.pedido" key={pedido.channelId} pedido={pedido} />
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

const BotaoDeAba: React.FC<{
  ativa: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ ativa, onClick, children }) => (
  <button data-gc="amizades.solicitacoes-de-mensagens.button.on-click"
    onClick={onClick}
    className={cn(
      "rounded px-2 py-1 text-sm font-medium transition",
      ativa ? "bg-selecionado text-ink" : "text-ink-muted hover:bg-hover hover:text-ink",
    )}
  >
    {children}
  </button>
);

const Vazio: React.FC<{ aba: Aba }> = ({ aba }) => {
  const { t } = useTranslation();

  return (
  <div data-gc="amizades.solicitacoes-de-mensagens.div--3" className="flex flex-col items-center justify-center gap-2 py-24 text-center">
    {aba === "pedidos" ? (
      <Envelope data-gc="amizades.solicitacoes-de-mensagens.envelope--2" size={40} className="text-ink-faint/60" />
    ) : (
      <ShieldWarning data-gc="amizades.solicitacoes-de-mensagens.shield-warning" size={40} className="text-ink-faint/60" />
    )}

    <p data-gc="amizades.solicitacoes-de-mensagens.p--3" className="text-sm font-semibold">
      {aba === "pedidos" ? t("amizades.semPedidos") : t("amizades.semSpam")}
    </p>
    <p data-gc="amizades.solicitacoes-de-mensagens.p--4" className="max-w-sm text-xs leading-relaxed text-ink-muted">
      {aba === "pedidos" ? t("amizades.semPedidosDetalhe") : t("amizades.semSpamDetalhe")}
    </p>
  </div>
  );
};

const Pedido: React.FC<{ pedido: PedidoDeDm }> = ({ pedido }) => {
  const { t } = useTranslation();
  const responder = useResponderPedidoDeDm();

  const responderCom = (acao: "aceitar" | "ignorar" | "spam") =>
    responder.mutate({ channelId: pedido.channelId, acao });

  return (
    <li data-gc="amizades.solicitacoes-de-mensagens.li" className="flex items-center gap-3 rounded-lg px-2 py-3 transition hover:bg-hover">
      <Avatar data-gc="amizades.solicitacoes-de-mensagens.avatar"
        id={pedido.de.id}
        name={pedido.de.displayName}
        url={pedido.de.avatarUrl}
        size={40}
      />

      <div data-gc="amizades.solicitacoes-de-mensagens.div--4" className="min-w-0 flex-1">
        <p data-gc="amizades.solicitacoes-de-mensagens.p--5" className="flex items-baseline gap-1.5">
          <span data-gc="amizades.solicitacoes-de-mensagens.span--3" className="truncate text-sm font-semibold">{pedido.de.displayName}</span>
          <span data-gc="amizades.solicitacoes-de-mensagens.span--4" className="truncate text-xs text-ink-faint">{pedido.de.username}</span>
        </p>

        <p data-gc="amizades.solicitacoes-de-mensagens.p--6" className="truncate text-xs text-ink-muted">
          {pedido.servidoresEmComum === 0
            ? t("amizades.semServidoresEmComum")
            : pedido.servidoresEmComum === 1
              ? t("amizades.umServidorEmComum")
              : t("amizades.servidoresEmComum", { quantos: pedido.servidoresEmComum })}
          {pedido.previa ? ` — ${pedido.previa}` : ""}
        </p>
      </div>

      <div data-gc="amizades.solicitacoes-de-mensagens.div--5" className="flex shrink-0 gap-2">
        <Button data-gc="amizades.solicitacoes-de-mensagens.button"
          variant="surface"
          size="sm"
          disabled={responder.isPending}
          onClick={() => responderCom(pedido.spam ? "ignorar" : "spam")}
        >
          {pedido.spam ? t("amizades.ignorar") : t("amizades.marcarSpam")}
        </Button>

        <Button data-gc="amizades.solicitacoes-de-mensagens.button--2" size="sm" disabled={responder.isPending} onClick={() => responderCom("aceitar")}>
          {t("amizades.aceitar")}
        </Button>
      </div>
    </li>
  );
};
