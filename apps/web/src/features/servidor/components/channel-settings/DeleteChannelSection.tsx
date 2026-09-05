import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { Channel } from "@gravae/shared";

import { useDeleteChannel } from "~/@core/application/queries/guild/use-update-channel";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useTranslation } from "~/traducao";

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
  const { t } = useTranslation();
  const apagar = useDeleteChannel(guildId);
  const [confirmacao, setConfirmacao] = useState("");

  const pode = confirmacao.trim().toLowerCase() === channel.name.toLowerCase();

  return (
    <div data-gc="servidor.channel-settings.delete-channel-section.div" className="max-w-xl">
      <h2 data-gc="servidor.channel-settings.delete-channel-section.h2" className="text-xl font-semibold text-danger">{t("servidor.canal.excluir.titulo")}</h2>

      <div data-gc="servidor.channel-settings.delete-channel-section.div--2" className="mt-6 rounded-lg border border-danger/40 bg-danger/10 p-5">
        <p data-gc="servidor.channel-settings.delete-channel-section.p" className="flex items-center gap-2 font-semibold">
          <AlertTriangle data-gc="servidor.channel-settings.delete-channel-section.alert-triangle" size={18} className="text-danger" /> {t("servidor.excluir.aviso")}
        </p>
        <p data-gc="servidor.channel-settings.delete-channel-section.p--2" className="mt-2 text-sm text-ink-muted">
          {t("servidor.canal.excluir.historico", { canal: channel.name })}
        </p>
      </div>

      <div data-gc="servidor.channel-settings.delete-channel-section.div--3" className="mt-6">
        <p data-gc="servidor.channel-settings.delete-channel-section.p--3" className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {t("servidor.canal.excluir.digite", { canal: channel.name })}
        </p>
        <Input data-gc="servidor.channel-settings.delete-channel-section.input"
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
          placeholder={channel.name}
        />
      </div>

      <Button data-gc="servidor.channel-settings.delete-channel-section.button"
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
