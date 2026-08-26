import React, { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Trash2, X } from "lucide-react";
import type { Channel, GuildMember, Role } from "@gravae/shared";

import { InvitesSection } from "~/components/server-settings/InvitesSection";
import { ChannelOverviewSection } from "~/components/channel-settings/ChannelOverviewSection";
import { ChannelPermissionsSection } from "~/components/channel-settings/ChannelPermissionsSection";
import { DeleteChannelSection } from "~/components/channel-settings/DeleteChannelSection";
import { cn } from "~/lib/utils";

type Secao = "visao" | "permissoes" | "convites" | "excluir";

interface ChannelSettingsModalProps {
  open: boolean;
  onClose: () => void;
  guildId: string;
  channel: Channel;
  roles: Role[];
  members: GuildMember[];
  minhasPermissoes: string[];
  canManageChannels: boolean;
  canManageRoles: boolean;
}

export const ChannelSettingsModal: React.FC<ChannelSettingsModalProps> = ({
  open,
  onClose,
  guildId,
  channel,
  roles,
  members,
  minhasPermissoes,
  canManageChannels,
  canManageRoles,
}) => {
  const [secao, setSecao] = useState<Secao>("visao");

  type Item = { id: Secao; label: string; visivel: boolean; danger?: boolean };

  const itens: Item[] = ([
    { id: "visao", label: "Visão geral", visivel: canManageChannels },
    { id: "permissoes", label: "Permissões", visivel: canManageRoles },
    { id: "convites", label: "Convites", visivel: true },
    { id: "excluir", label: "Excluir canal", visivel: canManageChannels, danger: true },
  ] satisfies Item[]).filter((item) => item.visivel);

  const prefixo = channel.type === "VOICE" ? "CANAIS DE VOZ" : "CANAIS DE TEXTO";

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-surface-2" />
        <DialogPrimitive.Content className="fixed inset-0 z-50 flex outline-none">
          <DialogPrimitive.Title className="sr-only">
            Configurações de {channel.name}
          </DialogPrimitive.Title>

          <nav className="w-60 shrink-0 overflow-y-auto bg-surface-1 px-3 py-12">
            <p className="mb-2 truncate px-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              {channel.name} <span className="text-ink-faint/60">· {prefixo}</span>
            </p>

            {itens.map((item) => (
              <button
                key={item.id}
                onClick={() => setSecao(item.id)}
                className={cn(
                  "mb-0.5 flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left text-sm transition",
                  item.danger
                    ? "text-danger hover:bg-danger/10"
                    : secao === item.id
                      ? "bg-surface-4 text-ink"
                      : "text-ink-muted hover:bg-surface-3 hover:text-ink",
                )}
              >
                {item.label}
                {item.danger && <Trash2 size={14} />}
              </button>
            ))}
          </nav>

          <div className="flex-1 overflow-y-auto bg-surface-2 px-10 py-12">
            {secao === "visao" && <ChannelOverviewSection guildId={guildId} channel={channel} />}

            {secao === "permissoes" && (
              <ChannelPermissionsSection
                guildId={guildId}
                channel={channel}
                roles={roles}
                members={members}
                minhasPermissoes={minhasPermissoes}
              />
            )}

            {secao === "convites" && <InvitesSection guildId={guildId} />}

            {secao === "excluir" && (
              <DeleteChannelSection guildId={guildId} channel={channel} onClose={onClose} />
            )}
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-10 top-12 flex flex-col items-center gap-1 text-ink-muted transition hover:text-ink"
          >
            <span className="flex size-9 items-center justify-center rounded-full border-2 border-current">
              <X size={18} />
            </span>
            <span className="text-xs font-semibold">ESC</span>
          </button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
