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
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold text-danger">{t("servidor.excluir.titulo")}</h2>

      <div className="mt-4 flex gap-3 rounded-lg bg-danger/10 p-4">
        <AlertTriangle size={20} className="shrink-0 text-danger" />
        <div className="text-sm text-ink-muted">
          <p className="font-medium text-ink">{t("servidor.excluir.aviso")}</p>
          <p className="mt-1">
            {t("servidor.excluir.tudoVai", {
              servidor: guild.name,
              membros: guild.memberCount,
            })}
          </p>
        </div>
      </div>

      <div className="mt-6">
        {/* Interpolação, e não um `<strong>` no meio: frase partida por
            elemento não se traduz aos pedaços. */}
        <Label htmlFor="confirmar">
          {t("servidor.excluir.digite", { servidor: guild.name })}
        </Label>
        <Input
          id="confirmar"
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
          placeholder={guild.name}
          autoComplete="off"
        />
      </div>

      <Button
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
