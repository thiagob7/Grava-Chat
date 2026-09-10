import React, { useMemo, useState } from "react";
import { Mail, Phone, Search, Users, Volume2 } from "lucide-react";

import { useFindDms } from "~/@core/application/queries/friend/use-find-dms";
import { useFindFriends } from "~/@core/application/queries/friend/use-find-friends";
import { useAtivos } from "~/@core/application/queries/friend/use-ativos";
import { usePedidosDeDm } from "~/@core/application/queries/friend/use-pedidos-de-dm";
import { useVoiceStore } from "~/features/voz/stores/voice-store";
import { statusDaConversa } from "~/features/amizades/lib/status-da-conversa";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { Avatar } from "~/features/perfil/components/Avatar";
import { UserName } from "~/features/perfil/components/UserName";
import { cn } from "~/lib/utils";
import { flx, flxAttr } from "~/lib/compat-de-tema";
import { flxCls } from "~/lib/compat-de-tema";
import { useTranslation } from "~/traducao";

interface DmSidebarProps {
  activeChannelId: string | undefined;
  readStates: Record<string, { lido: string | null; naoLidas: number }>;
  user: SelfUserModel;
  onOpenFriends: () => void;
  onOpenSolicitacoes: () => void;
  solicitacoesAbertas: boolean;
  onSelectDm: (channelId: string) => void;
  largura: number;
  fluida?: boolean;
}

export const DmSidebar: React.FC<DmSidebarProps> = ({
  activeChannelId,
  readStates,
  user,
  onOpenFriends,
  onOpenSolicitacoes,
  solicitacoesAbertas,
  onSelectDm,
  largura,
  fluida = false,
}) => {
  const { t } = useTranslation();
  const { data: dms = [] } = useFindDms(true);
  const { data: relacoes = [] } = useFindFriends(true);

  const { data: caixaDePedidos } = usePedidosDeDm(true);
  const { data: ativos = [] } = useAtivos();
  const emVoz = new Set(ativos.map((a) => a.user.id));

  const canalEmChamada = useVoiceStore((s) => s.channelId);

  const [busca, setBusca] = useState("");

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return dms;

    return dms.filter(
      (dm) =>
        dm.user.displayName.toLowerCase().includes(termo) ||
        dm.user.username.toLowerCase().includes(termo),
    );
  }, [dms, busca]);

  const pedidosRecebidos = relacoes.filter((r) => r.status === "PENDING_IN").length;
  const pedidosPendentes = caixaDePedidos?.pedidos.length ?? 0;

  return (
    <aside data-gc="amizades.dm-sidebar.aside"
      {...flxAttr("colunaDasConversas")}
      className={cn(
        "group/coluna canto-do-miolo topo-do-miolo relative flex flex-col bg-surface-1",
        fluida ? "min-w-0 flex-1" : "shrink-0",
      )}
      style={fluida ? undefined : { width: largura }}
    >
      <div data-gc="amizades.dm-sidebar.div" aria-hidden {...flx("divisorDaLateral", "absolute inset-y-0 right-0 w-px bg-transparent")} />
      <div data-gc="amizades.dm-sidebar.div--2" {...flx("listaDeConversas", cn("lista-de-conversas miolo-recortado flex min-h-0 flex-1 flex-col", flxCls("listaDeConversasDoPainel")))}>
      <header data-gc="amizades.dm-sidebar.header" className={cn("regiao-de-arrasto flex h-[var(--layout-header-height)] items-center border-b border-line px-4 shadow-sm", flxCls("topoDaListaDeConversas"))}>
        <h1 data-gc="amizades.dm-sidebar.h1" className="truncate font-semibold">{t("amizades.mensagensDiretas")}</h1>
      </header>

      <div data-gc="amizades.dm-sidebar.div--3" className="relative flex min-h-0 flex-1 flex-col">
      <div data-gc="amizades.dm-sidebar.div--4" {...flx("roladorDeConversas", "flex-1 overflow-y-auto px-2 py-3")}>
        <div data-gc="amizades.dm-sidebar.div--5" className="relative mb-3">
          <Search data-gc="amizades.dm-sidebar.search" size={14} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input data-gc="amizades.dm-sidebar.input"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={t("amizades.encontreConversa")}
            aria-label={t("amizades.encontreConversa")}
            className="w-full rounded bg-surface-0 py-1.5 pl-7 pr-2 text-sm outline-none placeholder:text-ink-faint focus:ring-1 focus:ring-brand"
          />
        </div>

        <button data-gc="amizades.dm-sidebar.button.on-open-friends"
          onClick={onOpenFriends}
          className={cn(
            "mb-3 flex w-full items-center gap-3 rounded px-2 py-2 text-sm font-medium transition",
            activeChannelId || solicitacoesAbertas
              ? "text-ink-muted hover:bg-surface-3 hover:text-ink"
              : "bg-selecionado text-ink",
          )}
        >
          <Users data-gc="amizades.dm-sidebar.users" size={20} className="text-ink-faint" />
          {t("amizades.amigos")}
          {pedidosRecebidos > 0 && (
            <span data-gc="amizades.dm-sidebar.span" className="ml-auto rounded-full bg-danger px-1.5 text-xs font-semibold text-sobre-marca">
              {pedidosRecebidos}
            </span>
          )}
        </button>

        <button data-gc="amizades.dm-sidebar.button.on-open-solicitacoes"
          onClick={onOpenSolicitacoes}
          className={cn(
            "mb-3 flex w-full items-center gap-3 rounded px-2 py-2 text-sm font-medium transition",
            solicitacoesAbertas
              ? "bg-selecionado text-ink"
              : "text-ink-muted hover:bg-surface-3 hover:text-ink",
          )}
        >
          <Mail data-gc="amizades.dm-sidebar.mail" size={20} className="text-ink-faint" />
          {t("amizades.solicitacoes")}
          {pedidosPendentes > 0 && (
            <span data-gc="amizades.dm-sidebar.span--2" className="ml-auto rounded-full bg-danger px-1.5 text-xs font-semibold text-sobre-marca">
              {pedidosPendentes}
            </span>
          )}
        </button>

        <h2 data-gc="amizades.dm-sidebar.h2" className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
          {t("amizades.conversas")}
        </h2>

        {visiveis.length === 0 && !busca && (
          <p data-gc="amizades.dm-sidebar.p" className="px-2 py-1 text-xs text-ink-faint">
            {t("amizades.semConversas")}
          </p>
        )}

        {visiveis.length === 0 && busca && (
          <p data-gc="amizades.dm-sidebar.p--2" className="px-2 py-1 text-xs text-ink-faint">{t("amizades.semConversaComEsseNome")}</p>
        )}

        {visiveis.map((dm) => {
          const ativa = dm.id === activeChannelId;
          const naoLida = !ativa && dm.lastMessageId && dm.lastMessageId !== readStates[dm.id]?.lido;

          return (
            <button data-gc="amizades.dm-sidebar.button"
              key={dm.id}
              onClick={() => onSelectDm(dm.id)}
              className={cn(
                "mb-0.5 flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-sm transition",
                flxCls("itemDeConversa"),
                ativa
                  ? cn("bg-selecionado text-ink", flxCls("itemDeConversaAtivo"))
                  : naoLida
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
                  <UserName data-gc="amizades.dm-sidebar.user-name" nome={dm.user.displayName} ehBot={dm.user.isBot} ehSistema={dm.user.sistema} selo="sm" />
                </span>

                {(() => {
                  const status = statusDaConversa({
                    emChamadaComigo: canalEmChamada === dm.id,
                    emVozNoServidor: emVoz.has(dm.user.id),
                  });

                  if (!status) return null;

                  return (
                    <span data-gc="amizades.dm-sidebar.span--5" className="flex items-center gap-1 truncate text-xs font-normal text-ink-faint">
                      {status.tipo === "chamada" ? (
                        <Phone data-gc="amizades.dm-sidebar.phone" size={11} className="shrink-0 text-online" />
                      ) : (
                        <Volume2 data-gc="amizades.dm-sidebar.volume2" size={11} className="shrink-0 text-online" />
                      )}
                      {status.texto}
                    </span>
                  );
                })()}
              </span>

              {naoLida && <span data-gc="amizades.dm-sidebar.span--6" className="ml-auto size-2 shrink-0 rounded-full bg-ink" />}
            </button>
          );
        })}
      </div>

      </div>
      </div>

    </aside>
  );
};
