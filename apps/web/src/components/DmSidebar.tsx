import React from "react";
import { Users } from "lucide-react";

import { useFindDms } from "~/@core/application/queries/friend/use-find-dms";
import { useFindFriends } from "~/@core/application/queries/friend/use-find-friends";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { Avatar } from "~/components/Avatar";
import { UserPanel } from "~/components/UserPanel";
import { cn } from "~/lib/utils";
import { AlcaDeLargura, useLarguraAjustavel } from "~/components/ui/resizable";

interface DmSidebarProps {
  activeChannelId: string | undefined;
  readStates: Record<string, string | null>;
  user: SelfUserModel;
  onOpenFriends: () => void;
  onSelectDm: (channelId: string) => void;
  onLogout: () => void;
}

/** A barra lateral do "modo amigos" — substitui a lista de canais fora dos servidores. */
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

  const pedidosRecebidos = relacoes.filter((r) => r.status === "PENDING_IN").length;

  const { largura, arrastando, alca, limites } = useLarguraAjustavel("dm", {
    padrao: 240,
    min: 180,
    max: 420,
    borda: "direita",
  });

  return (
    <aside className="relative flex shrink-0 flex-col bg-surface-1" style={{ width: largura }}>
      <header className="flex h-12 items-center border-b border-black/20 px-4 shadow-sm">
        <h1 className="truncate font-semibold">Mensagens diretas</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-2 py-3">
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

        {dms.length === 0 && (
          <p className="px-2 py-1 text-xs text-ink-faint">
            Nenhuma conversa ainda. Adicione um amigo para começar.
          </p>
        )}

        {dms.map((dm) => {
          const ativa = dm.id === activeChannelId;
          const naoLida = !ativa && dm.lastMessageId && dm.lastMessageId !== readStates[dm.id];

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
              <span className="truncate">{dm.user.displayName}</span>
              {naoLida && <span className="ml-auto size-2 shrink-0 rounded-full bg-ink" />}
            </button>
          );
        })}
      </div>

      <UserPanel user={user} onLogout={onLogout} />
      <AlcaDeLargura borda="direita" arrastando={arrastando} largura={largura} limites={limites} {...alca} />
    </aside>
  );
};
