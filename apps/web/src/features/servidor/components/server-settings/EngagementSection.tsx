import React, { useState } from "react";
import type { Channel } from "@gravae/shared";

import { useUpdateGuild } from "~/@core/application/queries/guild/use-update-guild";
import { useSession } from "~/contexts/session-context";
import type { GuildModel } from "~/@core/domain/models/guild-model";
import { UnsavedBar } from "~/components/ui/unsaved-bar";
import { Label, Textarea } from "~/components/ui/input";
import { SelectField } from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

interface EngagementSectionProps {
  guild: GuildModel;
  channels: Channel[];
}

export const EngagementSection: React.FC<EngagementSectionProps> = ({
  guild,
  channels,
}) => {
  const { t } = useTranslation();
  const save = useUpdateGuild();
  const [welcome, setWelcome] = useState(guild.welcomeEnabled ?? true);
  const [channel, setChannel] = useState(guild.systemChannelId ?? "");
  const [text, setText] = useState(guild.welcomeMessage ?? "");
  const { user } = useSession();

  const textChannels = channels.filter((c) => c.type === "TEXT");

  const changed =
    welcome !== (guild.welcomeEnabled ?? true) ||
    channel !== (guild.systemChannelId ?? "") ||
    text !== (guild.welcomeMessage ?? "");

  const preview = (text.trim() || "{pessoa} acabou de chegar!")
    .replaceAll("{pessoa}", `@${user?.displayName ?? "alguém"}`)
    .replaceAll("{nome}", user?.displayName ?? "alguém")
    .replaceAll("{servidor}", guild.name)
    .replaceAll("{contagem}", String(guild.memberCount ?? 1));

  return (
    <div data-gc="servidor.server-settings.engagement-section.div" className="max-w-2xl pb-10">
      <h2 data-gc="servidor.server-settings.engagement-section.h2" className="text-xl font-semibold">{t("servidor.engajamento.titulo")}</h2>
      <p data-gc="servidor.server-settings.engagement-section.p" className="mt-1 text-sm text-ink-muted">
        {t("servidor.engajamento.descricao")}
      </p>

      <section data-gc="servidor.server-settings.engagement-section.section" className="mt-6">
        <h3 data-gc="servidor.server-settings.engagement-section.h3" className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
          {t("servidor.engajamento.sistema")}
        </h3>

        <div data-gc="servidor.server-settings.engagement-section.div--2" className="mt-3 flex items-start gap-4">
          <div data-gc="servidor.server-settings.engagement-section.div--3" className="min-w-0 flex-1">
            <p data-gc="servidor.server-settings.engagement-section.p--2" className="text-sm font-medium">
              {t("servidor.engajamento.boasVindas")}
            </p>
            <p data-gc="servidor.server-settings.engagement-section.p--3" className="mt-0.5 text-xs text-ink-faint">
              {t("servidor.engajamento.sorteio")}
            </p>
          </div>
          <Switch data-gc="servidor.server-settings.engagement-section.switch.set-welcome" checked={welcome} onCheckedChange={setWelcome} />
        </div>

        <div data-gc="servidor.server-settings.engagement-section.div--4" className="mt-5">
          <Label data-gc="servidor.server-settings.engagement-section.label" htmlFor="canal-sistema">{t("servidor.engajamento.canalDoSistema")}</Label>
          <SelectField data-gc="servidor.server-settings.engagement-section.select-field.set-channel"
            id="canal-sistema"
            value={channel}
            onSelect={setChannel}
            options={[
              { value: "", label: t("servidor.engajamento.semCanal") },
              ...textChannels.map((c) => ({
                value: c.id,
                label: `#${c.name}`,
              })),
            ]}
          />
          <p data-gc="servidor.server-settings.engagement-section.p--4"
            className={cn(
              "mt-1.5 text-xs",
              welcome && !channel ? "text-idle" : "text-ink-faint",
            )}
          >
            {welcome && !channel
              ? "Escolha um canal — sem ele a chave acima não envia nada."
              : "Sem canal escolhido, a boas-vindas não é enviada."}
          </p>
        </div>

        <div data-gc="servidor.server-settings.engagement-section.div--5" className="mt-5">
          <Label data-gc="servidor.server-settings.engagement-section.label--2" htmlFor="texto-boas-vindas">{t("servidor.engajamento.mensagem")}</Label>

          <Textarea data-gc="servidor.server-settings.engagement-section.textarea"
            id="texto-boas-vindas"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            rows={2}
            disabled={!welcome}
            placeholder={t("servidor.engajamento.deixeVazio")}
          />

          <div data-gc="servidor.server-settings.engagement-section.div--6" className="mt-2 flex flex-wrap gap-1.5">
            {VARIABLES.map((v) => (
              <button data-gc="servidor.server-settings.engagement-section.button"
                key={v.key}
                type="button"
                disabled={!welcome}
                onClick={() => setText((current) => `${current}${v.key}`)}
                title={v.explains}
                className="rounded bg-surface-0 px-1.5 py-0.5 font-mono text-xs text-ink-muted transition hover:bg-surface-3 hover:text-ink disabled:opacity-50"
              >
                {v.key}
              </button>
            ))}
          </div>

          {welcome && (
            <div data-gc="servidor.server-settings.engagement-section.div--7" className="mt-3 rounded bg-surface-0 p-3">
              <p data-gc="servidor.server-settings.engagement-section.p--5" className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                {t("comum.previa")}
              </p>
              <p data-gc="servidor.server-settings.engagement-section.p--6" className="mt-1 whitespace-pre-wrap break-words text-sm text-ink-muted">
                {preview}
              </p>
            </div>
          )}
        </div>
      </section>

      <UnsavedBar data-gc="servidor.server-settings.engagement-section.unsaved-bar"
        visible={changed}
        saving={save.isPending}
        onDiscard={() => {
          setWelcome(guild.welcomeEnabled ?? true);
          setChannel(guild.systemChannelId ?? "");
          setText(guild.welcomeMessage ?? "");
        }}
        onSave={() =>
          save.mutate({
            guildId: guild.id,
            welcomeEnabled: welcome,
            systemChannelId: channel || null,
            welcomeMessage: text.trim() || null,
          })
        }
      />
    </div>
  );
};

const VARIABLES = [
  { key: "{pessoa}", explains: "Marca a pessoa — ela é notificada" },
  { key: "{nome}", explains: "O nome, sem marcar ninguém" },
  { key: "{servidor}", explains: "O nome do servidor" },
  { key: "{contagem}", explains: "Quantos membros o servidor tem agora" },
];
