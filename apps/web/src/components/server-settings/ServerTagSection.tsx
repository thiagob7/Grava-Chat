import React, { useState } from "react";
import type { GuildModel } from "~/@core/domain/models/guild-model";

import { useUpdateGuild } from "~/@core/application/queries/guild/use-update-guild";
import { UnsavedBar } from "~/components/ui/unsaved-bar";
import { Input, Label } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

const INSIGNIAS = [
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
  const salvar = useUpdateGuild();
  const [tag, setTag] = useState(guild.tag ?? "");
  const [icone, setIcone] = useState(guild.tagIcon ?? INSIGNIAS[0]!);

  const mudou =
    (tag.trim() || null) !== (guild.tag ?? null) ||
    icone !== (guild.tagIcon ?? INSIGNIAS[0]);

  return (
    <div className="max-w-2xl pb-10">
      <h2 className="text-xl font-semibold">{t("servidor.etiqueta.titulo")}</h2>
      <p className="mt-1 text-sm text-ink-muted">
        {t("servidor.etiqueta.descricao")}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-8">
        <div className="space-y-5">
          <div>
            <Label htmlFor="tag">{t("servidor.etiqueta.escolhaNome")}</Label>
            <Input
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
            <p className="mt-1 text-xs text-ink-faint">
              {t("servidor.etiqueta.limite")}
            </p>
          </div>

          <div>
            <Label>{t("servidor.etiqueta.escolhaInsignia")}</Label>
            <div className="flex flex-wrap gap-2">
              {INSIGNIAS.map((item) => (
                <button
                  key={item}
                  onClick={() => setIcone(item)}
                  className={cn(
                    "flex size-10 items-center justify-center rounded-lg bg-surface-0 text-xl transition",
                    icone === item ? "ring-2 ring-brand" : "hover:bg-surface-3",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-surface-1 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            {t("comum.previa")}
          </p>

          <div className="space-y-3">
            <PreviaDeFala nome="Leonardo" texto={t("servidor.etiqueta.fala1")} />
            <PreviaDeFala
              nome={t("servidor.etiqueta.voce")}
              texto={t("servidor.etiqueta.fala2")}
              tag={tag.trim() || undefined}
              icone={icone}
            />
            <PreviaDeFala nome="Max" texto={t("servidor.etiqueta.fala3")} />
          </div>
        </div>
      </div>

      <UnsavedBar
        visivel={mudou}
        salvando={salvar.isPending}
        onDescartar={() => {
          setTag(guild.tag ?? "");
          setIcone(guild.tagIcon ?? INSIGNIAS[0]!);
        }}
        onSalvar={() =>
          salvar.mutate({
            guildId: guild.id,
            tag: tag.trim() || null,
            tagIcon: tag.trim() ? icone : null,
          })
        }
      />
    </div>
  );
};

const PreviaDeFala: React.FC<{
  nome: string;
  texto: string;
  tag?: string;
  icone?: string;
}> = ({ nome, texto, tag, icone }) => (
  <div className="flex items-start gap-2">
    <span className="mt-0.5 size-7 shrink-0 rounded-full bg-surface-4" />
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-sm font-medium">
        {nome}
        {tag && (
          <span className="flex items-center gap-0.5 rounded bg-brand/20 px-1.5 py-0.5 text-10 font-semibold text-brand">
            {icone} {tag}
          </span>
        )}
      </p>
      <p className="text-sm text-ink-muted">{texto}</p>
    </div>
  </div>
);
