import React, { useMemo, useState } from "react";
import { Phone, Search, Users, Volume2 } from "lucide-react";

import { useFindDms } from "~/@core/application/queries/friend/use-find-dms";
import { useFindFriends } from "~/@core/application/queries/friend/use-find-friends";
import { useAtivos } from "~/@core/application/queries/friend/use-ativos";
import { useVoiceStore } from "~/stores/voice-store";
import { statusDaConversa } from "~/lib/status-da-conversa";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { Avatar } from "~/components/Avatar";
import { RodapeDaBarra } from "~/components/RodapeDaBarra";
import { cn } from "~/lib/utils";
import { AlcaDeLargura, useLarguraAjustavel } from "~/components/ui/resizable";

interface DmSidebarProps {
  activeChannelId: string | undefined;
  readStates: Record<string, { lido: string | null; naoLidas: number }>;
  user: SelfUserModel;
  onOpenFriends: () => void;
  onSelectDm: (channelId: string) => void;
  onLogout: () => void;
}

export const DmSidebar: React.FC<DmSidebarProps> = ({
  activeChannelId,
  readStates,
  user,
  onOpenFriends,
  onSelectDm,
  onLogout,
}) => {
  const { data: dms = [] } = useFindDms(true);
  const { data: relacoes = [] } = useFindFriends(true);

  /*
    Quem dos amigos está numa chamada agora. É a mesma consulta que alimenta a
    coluna "Ativo agora" — aqui ela vira o subtítulo "Em voz" na linha, que é
    a informação que decide se vale chamar a pessoa ou não.
  */
  const { data: ativos = [] } = useAtivos();
  const emVoz = new Set(ativos.map((a) => a.user.id));

  /*
    A chamada de privado NÃO vem do `useAtivos` — o servidor a exclui de
    propósito, porque ninguém entra na conversa privada dos outros. Quando ela
    é comigo, quem sabe disso é o meu próprio store.
  */
  const canalEmChamada = useVoiceStore((s) => s.channelId);

  const [busca, setBusca] = useState("");

  /*
    O filtro olha nome E usuário: você lembra de alguém por um ou por outro,
    e obrigar a acertar qual dos dois seria uma busca que só funciona quando
    você já sabe a resposta.
  */
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

  const { largura, arrastando, alca, limites } = useLarguraAjustavel("dm", {
    padrao: 240,
    min: 180,
    max: 420,
    borda: "direita",
  });

  return (
    <aside className="relative flex shrink-0 flex-col bg-surface-1" style={{ width: largura }}>
      <header className="regiao-de-arrasto flex h-12 items-center border-b border-divisor px-4 shadow-sm">
        <h1 className="truncate font-semibold">Mensagens diretas</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        <div className="relative mb-3">
          <Search size={14} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Encontre uma conversa"
            aria-label="Encontre uma conversa"
            className="w-full rounded bg-surface-0 py-1.5 pl-7 pr-2 text-sm outline-none placeholder:text-ink-faint focus:ring-1 focus:ring-brand"
          />
        </div>

        <button
          onClick={onOpenFriends}
          className={cn(
            "mb-3 flex w-full items-center gap-3 rounded px-2 py-2 text-sm font-medium transition",
            activeChannelId ? "text-ink-muted hover:bg-surface-3 hover:text-ink" : "bg-surface-4 text-ink",
          )}
        >
          <Users size={20} className="text-ink-faint" />
          Amigos
          {pedidosRecebidos > 0 && (
            <span className="ml-auto rounded-full bg-danger px-1.5 text-xs font-semibold text-white">
              {pedidosRecebidos}
            </span>
          )}
        </button>

        <h2 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
          Conversas
        </h2>

        {visiveis.length === 0 && !busca && (
          <p className="px-2 py-1 text-xs text-ink-faint">
            Nenhuma conversa ainda. Adicione um amigo para começar.
          </p>
        )}

        {visiveis.length === 0 && busca && (
          <p className="px-2 py-1 text-xs text-ink-faint">Nenhuma conversa com esse nome.</p>
        )}

        {visiveis.map((dm) => {
          const ativa = dm.id === activeChannelId;
          const naoLida = !ativa && dm.lastMessageId && dm.lastMessageId !== readStates[dm.id]?.lido;

          return (
            <button
              key={dm.id}
              onClick={() => onSelectDm(dm.id)}
              className={cn(
                "mb-0.5 flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-sm transition",
                ativa
                  ? "bg-surface-4 text-ink"
                  : naoLida
                    ? "font-semibold text-ink hover:bg-surface-3"
                    : "text-ink-muted hover:bg-surface-3",
              )}
            >
              <Avatar
                id={dm.user.id}
                name={dm.user.displayName}
                url={dm.user.avatarUrl}
                size={32}
                status={dm.user.status}
              />
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate">{dm.user.displayName}</span>

                {/* só aparece quando há o que dizer — linha vazia embaixo de
                    cada nome só faria a lista ocupar o dobro da altura */}
                {(() => {
                  const status = statusDaConversa({
                    emChamadaComigo: canalEmChamada === dm.id,
                    emVozNoServidor: emVoz.has(dm.user.id),
                  });

                  if (!status) return null;

                  return (
                    <span className="flex items-center gap-1 truncate text-xs font-normal text-ink-faint">
                      {status.tipo === "chamada" ? (
                        <Phone size={11} className="shrink-0 text-online" />
                      ) : (
                        <Volume2 size={11} className="shrink-0 text-online" />
                      )}
                      {status.texto}
                    </span>
                  );
                })()}
              </span>

              {naoLida && <span className="ml-auto size-2 shrink-0 rounded-full bg-ink" />}
            </button>
          );
        })}
      </div>

      <RodapeDaBarra user={user} onLogout={onLogout} />
      <AlcaDeLargura borda="direita" arrastando={arrastando} largura={largura} limites={limites} {...alca} />
    </aside>
  );
};
