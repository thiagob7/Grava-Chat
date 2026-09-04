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
    <div className="max-w-xl">
      <h2 className="text-xl font-semibold text-danger">{t("servidor.canal.excluir.titulo")}</h2>

      <div className="mt-6 rounded-lg border border-danger/40 bg-danger/10 p-5">
        <p className="flex items-center gap-2 font-semibold">
          <AlertTriangle size={18} className="text-danger" /> {t("servidor.excluir.aviso")}
        </p>
        {/*
          O nome do canal por interpolação, e não num `<strong>` no meio.

          Frase partida por elemento não se traduz aos pedaços: cada idioma
          ordena as partes do seu jeito. Perde-se o negrito no nome — ele
          continua na frase, e a frase continua certa em 34 idiomas.
        */}
        <p className="mt-2 text-sm text-ink-muted">
          {t("servidor.canal.excluir.historico", { canal: channel.name })}
        </p>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {t("servidor.canal.excluir.digite", { canal: channel.name })}
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
