import React, { useState } from "react";
import type { Channel } from "@gravae/shared";

import { useUpdateGuild } from "~/@core/application/queries/guild/use-update-guild";
import { useSession } from "~/contexts/session-context";
import type { GuildModel } from "~/@core/domain/models/guild-model";
import { UnsavedBar } from "~/components/ui/unsaved-bar";
import { Label, Textarea } from "~/components/ui/input";
import { CampoSelect } from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { cn } from "~/lib/utils";

interface EngagementSectionProps {
  guild: GuildModel;
  channels: Channel[];
}

export const EngagementSection: React.FC<EngagementSectionProps> = ({ guild, channels }) => {
  const salvar = useUpdateGuild();
  const [welcome, setWelcome] = useState(guild.welcomeEnabled ?? true);
  const [canal, setCanal] = useState(guild.systemChannelId ?? "");
  const [texto, setTexto] = useState(guild.welcomeMessage ?? "");
  const { user } = useSession();

  const canaisDeTexto = channels.filter((c) => c.type === "TEXT");

  const mudou =
    welcome !== (guild.welcomeEnabled ?? true) ||
    canal !== (guild.systemChannelId ?? "") ||
    texto !== (guild.welcomeMessage ?? "");

  /// A prévia usa VOCÊ como cobaia: é o jeito mais rápido de ver se a frase
  /// ficou boa sem esperar alguém entrar de verdade no servidor.
  const previa = (texto.trim() || "{pessoa} acabou de chegar!")
    .replaceAll("{pessoa}", `@${user?.displayName ?? "alguém"}`)
    .replaceAll("{nome}", user?.displayName ?? "alguém")
    .replaceAll("{servidor}", guild.name)
    .replaceAll("{contagem}", String(guild.memberCount ?? 1));

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
              Sem texto próprio embaixo, a frase é sorteada — sempre a mesma cansa rápido.
            </p>
          </div>
          <Switch checked={welcome} onCheckedChange={setWelcome} />
        </div>

        <div className="mt-5">
          <Label htmlFor="canal-sistema">Canal de mensagens do sistema</Label>
          <CampoSelect
            id="canal-sistema"
            valor={canal}
            onEscolher={setCanal}
            opcoes={[
              { valor: "", rotulo: "Sem canal de sistema" },
              ...canaisDeTexto.map((c) => ({ valor: c.id, rotulo: `#${c.name}` })),
            ]}
          />
          {/*
            Ligado e sem canal é a combinação que não faz nada, e era fácil
            terminar nela sem perceber: a chave acima aparece ligada por padrão
            e o aviso era cinza como qualquer outra legenda.
          */}
          <p className={cn("mt-1.5 text-xs", welcome && !canal ? "text-idle" : "text-ink-faint")}>
            {welcome && !canal
              ? "Escolha um canal — sem ele a chave acima não envia nada."
              : "Sem canal escolhido, a boas-vindas não é enviada."}
          </p>
        </div>

        <div className="mt-5">
          <Label htmlFor="texto-boas-vindas">Mensagem de boas-vindas</Label>

          <Textarea
            id="texto-boas-vindas"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={500}
            rows={2}
            disabled={!welcome}
            placeholder="Deixe vazio para sortear entre as frases prontas"
          />

          <div className="mt-2 flex flex-wrap gap-1.5">
            {VARIAVEIS.map((v) => (
              <button
                key={v.chave}
                type="button"
                disabled={!welcome}
                onClick={() => setTexto((atual) => `${atual}${v.chave}`)}
                title={v.explica}
                className="rounded bg-surface-0 px-1.5 py-0.5 font-mono text-xs text-ink-muted transition hover:bg-surface-3 hover:text-ink disabled:opacity-50"
              >
                {v.chave}
              </button>
            ))}
          </div>

          {welcome && (
            <div className="mt-3 rounded bg-surface-0 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Prévia</p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-ink-muted">{previa}</p>
            </div>
          )}
        </div>
      </section>

      <UnsavedBar
        visivel={mudou}
        salvando={salvar.isPending}
        onDescartar={() => {
          setWelcome(guild.welcomeEnabled ?? true);
          setCanal(guild.systemChannelId ?? "");
          setTexto(guild.welcomeMessage ?? "");
        }}
        onSalvar={() =>
          salvar.mutate({
            guildId: guild.id,
            welcomeEnabled: welcome,
            systemChannelId: canal || null,
            welcomeMessage: texto.trim() || null,
          })
        }
      />
    </div>
  );
};

const VARIAVEIS = [
  { chave: "{pessoa}", explica: "Marca a pessoa — ela é notificada" },
  { chave: "{nome}", explica: "O nome, sem marcar ninguém" },
  { chave: "{servidor}", explica: "O nome do servidor" },
  { chave: "{contagem}", explica: "Quantos membros o servidor tem agora" },
];
