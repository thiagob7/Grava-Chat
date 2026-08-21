import React, { useState } from "react";
import type { Channel } from "@gravae/shared";

import { useUpdateGuild } from "~/@core/application/queries/guild/use-update-guild";
import type { GuildModel } from "~/@core/domain/models/guild-model";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/input";
import { Switch } from "~/components/ui/switch";

interface EngagementSectionProps {
  guild: GuildModel;
  channels: Channel[];
}

export const EngagementSection: React.FC<EngagementSectionProps> = ({ guild, channels }) => {
  const salvar = useUpdateGuild();
  const [welcome, setWelcome] = useState(guild.welcomeEnabled ?? true);
  const [canal, setCanal] = useState(guild.systemChannelId ?? "");

  const canaisDeTexto = channels.filter((c) => c.type === "TEXT");
  const mudou = welcome !== (guild.welcomeEnabled ?? true) || canal !== (guild.systemChannelId ?? "");

  return (
    <div className="max-w-2xl pb-10">
      <h2 className="text-xl font-semibold">Engajamento</h2>
      <p className="mt-1 text-sm text-ink-muted">
        O que o servidor faz sozinho para não parecer vazio quando chega gente nova.
      </p>

      <section className="mt-6">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
          Mensagens do sistema
        </h3>

        <div className="mt-3 flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              Enviar uma mensagem de boas-vindas quando alguém entrar
            </p>
            <p className="mt-0.5 text-xs text-ink-faint">
              A frase é sorteada, como no Discord — sempre a mesma cansa rápido.
            </p>
          </div>
          <Switch checked={welcome} onCheckedChange={setWelcome} />
        </div>

        <div className="mt-5">
          <Label htmlFor="canal-sistema">Canal de mensagens do sistema</Label>
          <select
            id="canal-sistema"
            value={canal}
            onChange={(e) => setCanal(e.target.value)}
            className="w-full rounded bg-surface-0 px-3 py-2.5 text-sm outline-none ring-brand/60 focus:ring-2"
          >
            <option value="">Sem canal de sistema</option>
            {canaisDeTexto.map((c) => (
              <option key={c.id} value={c.id}>
                #{c.name}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-ink-faint">
            Sem canal escolhido, a boas-vindas não é enviada.
          </p>
        </div>
      </section>

      {mudou && (
        <footer className="sticky bottom-0 mt-6 flex items-center gap-3 rounded bg-surface-0 px-4 py-3">
          <p className="flex-1 text-sm">Você tem alterações não salvas.</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setWelcome(guild.welcomeEnabled ?? true);
              setCanal(guild.systemChannelId ?? "");
            }}
          >
            Descartar
          </Button>
          <Button
            variant="success"
            size="sm"
            disabled={salvar.isPending}
            onClick={() =>
              salvar.mutate({
                guildId: guild.id,
                welcomeEnabled: welcome,
                systemChannelId: canal || null,
              })
            }
          >
            Salvar
          </Button>
        </footer>
      )}
    </div>
  );
};
