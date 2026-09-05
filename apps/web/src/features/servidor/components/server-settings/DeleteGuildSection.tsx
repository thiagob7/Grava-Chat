import React, { useState } from "react";
import { useNavigate } from "react-router";
import { AlertTriangle } from "lucide-react";

import { useDeleteGuild } from "~/@core/application/queries/guild/use-delete-guild";
import type { GuildModel } from "~/@core/domain/models/guild-model";
import { Button } from "~/components/ui/button";
import { Input, Label } from "~/components/ui/input";
import { useTranslation } from "~/traducao";

export const DeleteGuildSection: React.FC<{
  guild: GuildModel;
  onClose: () => void;
}> = ({ guild, onClose }) => {
  const { t } = useTranslation();
  const deleteGuild = useDeleteGuild();
  const navigate = useNavigate();
  const [confirmacao, setConfirmacao] = useState("");

  const confere = confirmacao.trim() === guild.name;

  const excluir = async () => {
    if (!confere) return;

    await deleteGuild.mutateAsync(guild.id).catch(() => null);
    onClose();
    navigate("/channels", { replace: true });
  };

  return (
    <div data-gc="servidor.server-settings.delete-guild-section.div" className="max-w-2xl">
      <h2 data-gc="servidor.server-settings.delete-guild-section.h2" className="text-xl font-semibold text-danger">{t("servidor.excluir.titulo")}</h2>

      <div data-gc="servidor.server-settings.delete-guild-section.div--2" className="mt-4 flex gap-3 rounded-lg bg-danger/10 p-4">
        <AlertTriangle data-gc="servidor.server-settings.delete-guild-section.alert-triangle" size={20} className="shrink-0 text-danger" />
        <div data-gc="servidor.server-settings.delete-guild-section.div--3" className="text-sm text-ink-muted">
          <p data-gc="servidor.server-settings.delete-guild-section.p" className="font-medium text-ink">{t("servidor.excluir.aviso")}</p>
          <p data-gc="servidor.server-settings.delete-guild-section.p--2" className="mt-1">
            {t("servidor.excluir.tudoVai", {
              servidor: guild.name,
              membros: guild.memberCount,
            })}
          </p>
        </div>
      </div>

      <div data-gc="servidor.server-settings.delete-guild-section.div--4" className="mt-6">
        <Label data-gc="servidor.server-settings.delete-guild-section.label" htmlFor="confirmar">
          {t("servidor.excluir.digite", { servidor: guild.name })}
        </Label>
        <Input data-gc="servidor.server-settings.delete-guild-section.input"
          id="confirmar"
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
          placeholder={guild.name}
          autoComplete="off"
        />
      </div>

      <Button data-gc="servidor.server-settings.delete-guild-section.button"
        variant="danger"
        onClick={() => void excluir()}
        disabled={!confere || deleteGuild.isPending}
        className="mt-4"
      >
        {deleteGuild.isPending
          ? "Excluindo…"
          : "Excluir servidor permanentemente"}
      </Button>
    </div>
  );
};
