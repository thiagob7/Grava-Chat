import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { Channel } from "@gravae/shared";

import { useDeleteChannel } from "~/@core/application/queries/guild/use-update-channel";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

interface DeleteChannelSectionProps {
  guildId: string;
  channel: Channel;
  onClose: () => void;
}

export const DeleteChannelSection: React.FC<DeleteChannelSectionProps> = ({
  guildId,
  channel,
  onClose,
}) => {
  const apagar = useDeleteChannel(guildId);
  const [confirmacao, setConfirmacao] = useState("");

  // digitar o nome é o freio: apagar canal leva o histórico junto e não desfaz
  const pode = confirmacao.trim().toLowerCase() === channel.name.toLowerCase();

  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-semibold text-danger">Excluir canal</h2>

      <div className="mt-6 rounded-lg border border-danger/40 bg-danger/10 p-5">
        <p className="flex items-center gap-2 font-semibold">
          <AlertTriangle size={18} className="text-danger" /> Isso não pode ser desfeito.
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          Todo o histórico de <strong>{channel.name}</strong> vai junto, para todo mundo.
        </p>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Digite <span className="text-ink">{channel.name}</span> para confirmar
        </p>
        <Input
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
          placeholder={channel.name}
        />
      </div>

      <Button
        variant="danger"
        className="mt-4"
        disabled={!pode || apagar.isPending}
        onClick={() =>
          apagar.mutate({ guildId, channelId: channel.id }, { onSuccess: onClose })
        }
      >
        {apagar.isPending ? "Excluindo…" : "Excluir canal permanentemente"}
      </Button>
    </div>
  );
};
