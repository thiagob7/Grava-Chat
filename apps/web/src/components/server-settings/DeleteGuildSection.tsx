import React, { useState } from "react";
import { useNavigate } from "react-router";
import { AlertTriangle } from "lucide-react";

import { useDeleteGuild } from "~/@core/application/queries/guild/use-delete-guild";
import type { GuildModel } from "~/@core/domain/models/guild-model";
import { Button } from "~/components/ui/button";
import { Input, Label } from "~/components/ui/input";

export const DeleteGuildSection: React.FC<{ guild: GuildModel; onClose: () => void }> = ({
  guild,
  onClose,
}) => {
  const deleteGuild = useDeleteGuild();
  const navigate = useNavigate();
  const [confirmacao, setConfirmacao] = useState("");

  /**
   * Digitar o nome não é burocracia: apagar leva junto todos os canais, todas as
   * mensagens e o histórico de todo mundo que está no servidor. Não tem desfazer.
   */
  const confere = confirmacao.trim() === guild.name;

  const excluir = async () => {
    if (!confere) return;

    await deleteGuild.mutateAsync(guild.id).catch(() => null);
    onClose();
    navigate("/channels", { replace: true });
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold text-danger">Excluir servidor</h2>

      <div className="mt-4 flex gap-3 rounded-lg bg-danger/10 p-4">
        <AlertTriangle size={20} className="shrink-0 text-danger" />
        <div className="text-sm text-ink-muted">
          <p className="font-medium text-ink">Isso não pode ser desfeito.</p>
          <p className="mt-1">
            Todos os canais, mensagens e convites de <strong>{guild.name}</strong> serão apagados
            para os {guild.memberCount} membros. Ninguém consegue recuperar depois.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <Label htmlFor="confirmar">
          Digite <strong className="text-ink">{guild.name}</strong> para confirmar
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
        {deleteGuild.isPending ? "Excluindo…" : "Excluir servidor permanentemente"}
      </Button>
    </div>
  );
};
