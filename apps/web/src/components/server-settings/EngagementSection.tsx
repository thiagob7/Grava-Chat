import React, { useState } from "react";
import type { Channel } from "@gravae/shared";

import { useUpdateGuild } from "~/@core/application/queries/guild/use-update-guild";
import type { GuildModel } from "~/@core/domain/models/guild-model";
import { UnsavedBar } from "~/components/ui/unsaved-bar";
import { Label, campoBase } from "~/components/ui/input";
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
            className={campoBase}
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

      <UnsavedBar
        visivel={mudou}
        salvando={salvar.isPending}
        onDescartar={() => {
          setWelcome(guild.welcomeEnabled ?? true);
          setCanal(guild.systemChannelId ?? "");
        }}
        onSalvar={() =>
          salvar.mutate({
            guildId: guild.id,
            welcomeEnabled: welcome,
            systemChannelId: canal || null,
          })
        }
      />
    </div>
  );
};
