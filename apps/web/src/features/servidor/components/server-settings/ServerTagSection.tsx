import React, { useState } from "react";
import type { GuildModel } from "~/@core/domain/models/guild-model";

import { useUpdateGuild } from "~/@core/application/queries/guild/use-update-guild";
import { UnsavedBar } from "~/components/ui/unsaved-bar";
import { Input, Label } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

const BADGES = [
  "🍃",
  "⚔️",
  "💜",
  "🔥",
  "💧",
  "💀",
  "🌙",
  "⚡",
  "✨",
  "🎮",
  "🎧",
  "🏆",
];

export const ServerTagSection: React.FC<{ guild: GuildModel }> = ({
  guild,
}) => {
  const { t } = useTranslation();
  const save = useUpdateGuild();
  const [tag, setTag] = useState(guild.tag ?? "");
  const [icon, setIcon] = useState(guild.tagIcon ?? BADGES[0]!);

  const changed =
    (tag.trim() || null) !== (guild.tag ?? null) ||
    icon !== (guild.tagIcon ?? BADGES[0]);

  return (
    <div data-gc="servidor.server-settings.server-tag-section.div" className="max-w-2xl pb-10">
      <h2 data-gc="servidor.server-settings.server-tag-section.h2" className="text-xl font-semibold">{t("servidor.etiqueta.titulo")}</h2>
      <p data-gc="servidor.server-settings.server-tag-section.p" className="mt-1 text-sm text-ink-muted">
        {t("servidor.etiqueta.descricao")}
      </p>

      <div data-gc="servidor.server-settings.server-tag-section.div--2" className="mt-6 grid grid-cols-2 gap-8">
        <div data-gc="servidor.server-settings.server-tag-section.div--3" className="space-y-5">
          <div data-gc="servidor.server-settings.server-tag-section.div--4">
            <Label data-gc="servidor.server-settings.server-tag-section.label" htmlFor="tag">{t("servidor.etiqueta.escolhaNome")}</Label>
            <Input data-gc="servidor.server-settings.server-tag-section.input"
              id="tag"
              value={tag}
              maxLength={4}
              placeholder="GVE"
              onChange={(e) =>
                setTag(
                  e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase(),
                )
              }
            />
            <p data-gc="servidor.server-settings.server-tag-section.p--2" className="mt-1 text-xs text-ink-faint">
              {t("servidor.etiqueta.limite")}
            </p>
          </div>

          <div data-gc="servidor.server-settings.server-tag-section.div--5">
            <Label data-gc="servidor.server-settings.server-tag-section.label--2">{t("servidor.etiqueta.escolhaInsignia")}</Label>
            <div data-gc="servidor.server-settings.server-tag-section.div--6" className="flex flex-wrap gap-2">
              {BADGES.map((item) => (
                <button data-gc="servidor.server-settings.server-tag-section.button"
                  key={item}
                  onClick={() => setIcon(item)}
                  className={cn(
                    "flex size-10 items-center justify-center rounded-lg bg-surface-0 text-xl transition",
                    icon === item ? "ring-2 ring-brand" : "hover:bg-surface-3",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div data-gc="servidor.server-settings.server-tag-section.div--7" className="rounded-lg bg-surface-1 p-4">
          <p data-gc="servidor.server-settings.server-tag-section.p--3" className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            {t("comum.previa")}
          </p>

          <div data-gc="servidor.server-settings.server-tag-section.div--8" className="space-y-3">
            <SpeechPreview data-gc="servidor.server-settings.server-tag-section.speech-preview" name="Leonardo" text={t("servidor.etiqueta.fala1")} />
            <SpeechPreview data-gc="servidor.server-settings.server-tag-section.speech-preview--2"
              name={t("servidor.etiqueta.voce")}
              text={t("servidor.etiqueta.fala2")}
              tag={tag.trim() || undefined}
              icon={icon}
            />
            <SpeechPreview data-gc="servidor.server-settings.server-tag-section.speech-preview--3" name="Max" text={t("servidor.etiqueta.fala3")} />
          </div>
        </div>
      </div>

      <UnsavedBar data-gc="servidor.server-settings.server-tag-section.unsaved-bar"
        visible={changed}
        saving={save.isPending}
        onDiscard={() => {
          setTag(guild.tag ?? "");
          setIcon(guild.tagIcon ?? BADGES[0]!);
        }}
        onSave={() =>
          save.mutate({
            guildId: guild.id,
            tag: tag.trim() || null,
            tagIcon: tag.trim() ? icon : null,
          })
        }
      />
    </div>
  );
};

const SpeechPreview: React.FC<{
  name: string;
  text: string;
  tag?: string;
  icon?: string;
}> = ({ name, text, tag, icon }) => (
  <div data-gc="servidor.server-settings.server-tag-section.div--9" className="flex items-start gap-2">
    <span data-gc="servidor.server-settings.server-tag-section.span" className="mt-0.5 size-7 shrink-0 rounded-full bg-surface-4" />
    <div data-gc="servidor.server-settings.server-tag-section.div--10" className="min-w-0">
      <p data-gc="servidor.server-settings.server-tag-section.p--4" className="flex items-center gap-1.5 text-sm font-medium">
        {name}
        {tag && (
          <span data-gc="servidor.server-settings.server-tag-section.span--2" className="flex items-center gap-0.5 rounded bg-brand/20 px-1.5 py-0.5 text-10 font-semibold text-brand">
            {icon} {tag}
          </span>
        )}
      </p>
      <p data-gc="servidor.server-settings.server-tag-section.p--5" className="text-sm text-ink-muted">{text}</p>
    </div>
  </div>
);
