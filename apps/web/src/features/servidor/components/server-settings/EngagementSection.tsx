import React, { useState } from "react";
import { AFK_TIMEOUTS, type Channel, type DefaultNotifications } from "@gravae/shared";

import { useUpdateGuild } from "~/@core/application/queries/guild/use-update-guild";
import { useSession } from "~/contexts/session-context";
import type { GuildModel } from "~/@core/domain/models/guild-model";
import { UnsavedBar } from "~/components/ui/unsaved-bar";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/input";
import { RadioIndicator } from "~/components/ui/radio-group";
import { SelectField } from "~/components/ui/select";
import {
  SettingsBlock,
  SettingsField,
  SettingsToggle,
} from "~/features/servidor/components/server-settings/SettingsBlocks";
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
  const { user } = useSession();

  const initial = () => ({
    welcome: guild.welcomeEnabled ?? true,
    channel: guild.systemChannelId ?? "",
    text: guild.welcomeMessage ?? "",
    afkChannel: guild.afkChannelId ?? "",
    afkTimeout: guild.afkTimeoutSeconds ?? 300,
    notifications: guild.defaultNotifications ?? "tudo",
    flexibleNames: guild.flexibleChannelNames === true,
    hideCrown: guild.hideOwnerCrown === true,
  });

  const [form, setForm] = useState(initial);
  const base = initial();
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const textChannels = channels.filter((c) => c.type === "TEXT");
  const voiceChannels = channels.filter((c) => c.type === "VOICE");

  const changed = (Object.keys(form) as (keyof typeof form)[]).some((key) => form[key] !== base[key]);

  const preview = (form.text.trim() || "{pessoa} acabou de chegar!")
    .replaceAll("{pessoa}", `@${user?.displayName ?? "alguém"}`)
    .replaceAll("{nome}", user?.displayName ?? "alguém")
    .replaceAll("{servidor}", guild.name)
    .replaceAll("{contagem}", String(guild.memberCount ?? 1));

  return (
    <div data-gc="servidor.server-settings.engagement-section.div" className="max-w-2xl space-y-8 pb-10">
      <SettingsBlock data-gc="servidor.server-settings.engagement-section.settings-block"
        title="Inatividade"
        description="Quem fica parado numa chamada é levado para um canal de inatividade."
      >
        <SettingsField data-gc="servidor.server-settings.engagement-section.settings-field" label="Canal de inatividade" htmlFor="canal-inatividade">
          <SelectField data-gc="servidor.server-settings.engagement-section.select-field"
            id="canal-inatividade"
            value={form.afkChannel}
            onSelect={(value) => set("afkChannel", value)}
            options={[
              { value: "", label: "Nenhum canal" },
              ...voiceChannels.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        </SettingsField>

        <SettingsField data-gc="servidor.server-settings.engagement-section.settings-field--2"
          label="Tempo limite de inatividade"
          htmlFor="tempo-inatividade"
          hint="Depois desse tempo sem mexer no app e sem falar, a pessoa vai para o canal acima."
        >
          <SelectField data-gc="servidor.server-settings.engagement-section.select-field--2"
            id="tempo-inatividade"
            value={form.afkTimeout}
            disabled={!form.afkChannel}
            onSelect={(value) => set("afkTimeout", value)}
            options={AFK_TIMEOUTS.map((seconds) => ({ value: seconds, label: timeoutLabel(seconds) }))}
          />
        </SettingsField>
      </SettingsBlock>

      <SettingsBlock data-gc="servidor.server-settings.engagement-section.settings-block--2"
        title="Sistema e boas-vindas"
        description="Onde chegam as mensagens automáticas do servidor."
      >
        <SettingsField data-gc="servidor.server-settings.engagement-section.settings-field--3"
          label="Canal de destino"
          htmlFor="canal-sistema"
          hint={form.welcome && !form.channel ? "Escolha um canal — sem ele não sai mensagem de entrada." : undefined}
        >
          <SelectField data-gc="servidor.server-settings.engagement-section.select-field--3"
            id="canal-sistema"
            value={form.channel}
            onSelect={(value) => set("channel", value)}
            options={[
              { value: "", label: t("servidor.engajamento.semCanal") },
              ...textChannels.map((c) => ({ value: c.id, label: `#${c.name}` })),
            ]}
          />
        </SettingsField>

        <SettingsToggle data-gc="servidor.server-settings.engagement-section.settings-toggle"
          title="Ocultar mensagens de entrada"
          description="Não avisa no canal de destino quando alguém entra no servidor."
          checked={!form.welcome}
          onChange={(value) => set("welcome", !value)}
        />

        {form.welcome && (
          <SettingsField data-gc="servidor.server-settings.engagement-section.settings-field--4" label={t("servidor.engajamento.mensagem")} htmlFor="texto-boas-vindas">
            <Textarea data-gc="servidor.server-settings.engagement-section.textarea"
              id="texto-boas-vindas"
              value={form.text}
              onChange={(e) => set("text", e.target.value)}
              maxLength={500}
              rows={2}
              placeholder={t("servidor.engajamento.deixeVazio")}
            />

            <div data-gc="servidor.server-settings.engagement-section.div--2" className="mt-2 flex flex-wrap gap-1.5">
              {VARIABLES.map((v) => (
                <Button data-gc="servidor.server-settings.engagement-section.button"
                  key={v.key}
                  type="button"
                  variant="surface"
                  size="xs"
                  onClick={() => set("text", `${form.text}${v.key}`)}
                  title={v.explains}
                  className="rounded px-1.5 py-0.5 font-mono font-normal"
                >
                  {v.key}
                </Button>
              ))}
            </div>

            <div data-gc="servidor.server-settings.engagement-section.div--3" className="mt-3 rounded-lg border border-line-sutil bg-surface-2 p-3">
              <p data-gc="servidor.server-settings.engagement-section.p" className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{t("comum.previa")}</p>
              <p data-gc="servidor.server-settings.engagement-section.p--2" className="mt-1 whitespace-pre-wrap break-words text-sm text-ink-muted">{preview}</p>
            </div>
          </SettingsField>
        )}
      </SettingsBlock>

      <SettingsBlock data-gc="servidor.server-settings.engagement-section.settings-block--3"
        title="Notificações padrão"
        description="Vale para quem ainda não mexeu nas notificações deste servidor."
      >
        <div data-gc="servidor.server-settings.engagement-section.div--4" role="radiogroup" className="space-y-2">
          {NOTIFICATION_OPTIONS.map((option) => {
            const selected = form.notifications === option.value;

            return (
              <button data-gc="servidor.server-settings.engagement-section.button--2"
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => set("notifications", option.value)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition",
                  selected ? "border-brand/60 bg-brand/8" : "border-line-sutil hover:bg-hover",
                )}
              >
                <RadioIndicator data-gc="servidor.server-settings.engagement-section.radio-indicator" selected={selected} />
                <span data-gc="servidor.server-settings.engagement-section.span" className="min-w-0">
                  <span data-gc="servidor.server-settings.engagement-section.span--2" className="block text-sm font-medium">{option.label}</span>
                  <span data-gc="servidor.server-settings.engagement-section.span--3" className="block text-xs text-ink-muted">{option.detail}</span>
                </span>
              </button>
            );
          })}
        </div>
      </SettingsBlock>

      <SettingsBlock data-gc="servidor.server-settings.engagement-section.settings-block--4" title="Avançado">
        <SettingsToggle data-gc="servidor.server-settings.engagement-section.settings-toggle--2"
          title="Permitir nomes flexíveis em canais de texto"
          description="Aceita espaços no nome dos canais de texto, sem trocar por hífen."
          checked={form.flexibleNames}
          onChange={(value) => set("flexibleNames", value)}
        />

        <SettingsToggle data-gc="servidor.server-settings.engagement-section.settings-toggle--3"
          title="Ocultar a coroa do dono"
          description="A coroa deixa de aparecer ao lado do nome do dono na lista de membros."
          checked={form.hideCrown}
          onChange={(value) => set("hideCrown", value)}
        />
      </SettingsBlock>

      <UnsavedBar data-gc="servidor.server-settings.engagement-section.unsaved-bar"
        visible={changed}
        saving={save.isPending}
        onDiscard={() => setForm(initial())}
        onSave={() =>
          save.mutate({
            guildId: guild.id,
            welcomeEnabled: form.welcome,
            systemChannelId: form.channel || null,
            welcomeMessage: form.text.trim() || null,
            afkChannelId: form.afkChannel || null,
            afkTimeoutSeconds: form.afkTimeout,
            defaultNotifications: form.notifications,
            flexibleChannelNames: form.flexibleNames,
            hideOwnerCrown: form.hideCrown,
          })
        }
      />
    </div>
  );
};

const timeoutLabel = (seconds: number) =>
  seconds < 3600 ? `${seconds / 60} ${seconds === 60 ? "minuto" : "minutos"}` : `${seconds / 3600} hora`;

const NOTIFICATION_OPTIONS: { value: DefaultNotifications; label: string; detail: string }[] = [
  { value: "tudo", label: "Todas as mensagens", detail: "Avisa a cada mensagem nova nos canais." },
  { value: "mencoes", label: "Somente @menções", detail: "Avisa só quando alguém marca a pessoa, um cargo dela ou @everyone." },
];

const VARIABLES = [
  { key: "{pessoa}", explains: "Marca a pessoa — ela é notificada" },
  { key: "{nome}", explains: "O nome, sem marcar ninguém" },
  { key: "{servidor}", explains: "O nome do servidor" },
  { key: "{contagem}", explains: "Quantos membros o servidor tem agora" },
];
