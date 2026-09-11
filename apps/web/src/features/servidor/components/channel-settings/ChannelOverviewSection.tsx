import React, { useState } from "react";
import type { Channel, NameFont } from "@gravae/shared";
import { MODE_SLOW_OPTIONS } from "@gravae/shared";

import { useUpdateChannel } from "~/@core/application/queries/guild/use-update-channel";
import { Button } from "~/components/ui/button";
import { SelectField } from "~/components/ui/select";
import { UnsavedBar } from "~/components/ui/unsaved-bar";
import { SegmentedGroup, Label, CardOption, Textarea, Input } from "~/components/ui/input";
import { NameChannelField } from "~/features/servidor/components/CampoDeNomeDeCanal";
import { Slider } from "~/components/ui/slider";
import { useTranslation } from "~/traducao";

interface ChannelOverviewSectionProps {
  guildId: string;
  channel: Channel;
}

function modeSlowLabel(seconds: number) {
  if (!seconds) return "Desligado";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${seconds / 60} min`;
  return `${seconds / 3600} h`;
}

const VISIBILITIES = [
  {
    value: "DEFAULT" as const,
    title: "servidor.canal.padrao",
    description: "servidor.canal.padraoDica",
  },
  {
    value: "SPOILER" as const,
    title: "servidor.canal.spoiler",
    description: "servidor.canal.spoilerDica",
  },
  {
    value: "AGE_RESTRICTED" as const,
    title: "servidor.canal.idade",
    description: "servidor.canal.idadeDica",
  },
];

export const ChannelOverviewSection: React.FC<ChannelOverviewSectionProps> = ({
  guildId,
  channel,
}) => {
  const { t } = useTranslation();
  const save = useUpdateChannel(guildId);

  const [name, setName] = useState(channel.name);
  const [font, setFont] = useState<NameFont>(channel.font ?? "padrao");
  const [topic, setTopic] = useState(channel.topic ?? "");
  const [url, setUrl] = useState(channel.url ?? "");
  const [slowmode, setSlowmode] = useState(channel.slowmodeSeconds);
  const [visibility, setVisibility] = useState(channel.contentVisibility);
  const [bitrate, setBitrate] = useState(channel.bitrate);
  const [videoQuality, setVideoQuality] = useState(channel.videoQuality);
  const [userLimit, setUserLimit] = useState(channel.userLimit);

  const isVoice = channel.type === "VOICE";
  const isLink = channel.type === "LINK";

  const changed =
    name !== channel.name ||
    font !== (channel.font ?? "padrao") ||
    (topic || null) !== (channel.topic ?? null) ||
    (url || null) !== (channel.url ?? null) ||
    slowmode !== channel.slowmodeSeconds ||
    visibility !== channel.contentVisibility ||
    bitrate !== channel.bitrate ||
    videoQuality !== channel.videoQuality ||
    userLimit !== channel.userLimit;

  return (
    <div data-gc="servidor.channel-settings.channel-overview-section.div" className="max-w-2xl pb-10">
      <h2 data-gc="servidor.channel-settings.channel-overview-section.h2" className="text-xl font-semibold">{t("servidor.canal.visaoGeral")}</h2>

      <div data-gc="servidor.channel-settings.channel-overview-section.div--2" className="mt-6 space-y-6">
        <div data-gc="servidor.channel-settings.channel-overview-section.div--3">
          <Label data-gc="servidor.channel-settings.channel-overview-section.label" htmlFor="canal-nome">{t("servidor.canal.nome")}</Label>
          <NameChannelField data-gc="servidor.channel-settings.channel-overview-section.name-channel-field.set-name"
            id="canal-nome"
            value={name}
            onChange={setName}
            font={font}
            onFont={setFont}
            isVoice={isVoice}
          />
        </div>

        {isLink && (
          <div data-gc="servidor.channel-settings.channel-overview-section.div--4">
            <Label data-gc="servidor.channel-settings.channel-overview-section.label--2" htmlFor="canal-endereco">
              {t("servidor.canal.endereco")}
            </Label>
            <Input data-gc="servidor.channel-settings.channel-overview-section.input"
              id="canal-endereco"
              value={url}
              maxLength={512}
              placeholder="https://"
              onChange={(e) => setUrl(e.target.value)}
            />
            <p data-gc="servidor.channel-settings.channel-overview-section.p" className="mt-1.5 text-xs text-ink-faint">
              {t("servidor.canal.enderecoDica")}
            </p>
          </div>
        )}

        {!isVoice && !isLink && (
          <div data-gc="servidor.channel-settings.channel-overview-section.div--5">
            <Label data-gc="servidor.channel-settings.channel-overview-section.label--3" htmlFor="canal-topico">{t("servidor.canal.topico")}</Label>
            <Textarea data-gc="servidor.channel-settings.channel-overview-section.textarea"
              id="canal-topico"
              value={topic}
              maxLength={512}
              rows={3}
              placeholder={t("servidor.canal.topicoDica")}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
        )}

        {!isLink && (
        <div data-gc="servidor.channel-settings.channel-overview-section.div--6">
          <Label data-gc="servidor.channel-settings.channel-overview-section.label--4" htmlFor="modo-lento">Modo lento — {modeSlowLabel(slowmode)}</Label>
          <SelectField data-gc="servidor.channel-settings.channel-overview-section.select-field.set-slowmode"
            id="modo-lento"
            value={slowmode}
            onSelect={setSlowmode}
            options={MODE_SLOW_OPTIONS.map((seconds) => ({
              value: seconds,
              label: modeSlowLabel(seconds),
            }))}
          />
          <p data-gc="servidor.channel-settings.channel-overview-section.p--2" className="mt-1.5 text-xs text-ink-faint">
            {t("servidor.canal.modoLento")}
          </p>
        </div>
        )}

        {!isLink && (
        <div data-gc="servidor.channel-settings.channel-overview-section.div--7">
          <Label data-gc="servidor.channel-settings.channel-overview-section.label--5">{t("servidor.canal.visibilidade")}</Label>
          <div data-gc="servidor.channel-settings.channel-overview-section.div--8" className="space-y-2">
            {VISIBILITIES.map((option) => (
              <CardOption data-gc="servidor.channel-settings.channel-overview-section.card-option"
                key={option.value}
                selected={visibility === option.value}
                onSelect={() => setVisibility(option.value)}
                title={t(option.title)}
                description={t(option.description)}
              />
            ))}
          </div>
        </div>
        )}

        {isVoice && (
          <>
            <div data-gc="servidor.channel-settings.channel-overview-section.div--9">
              <Label data-gc="servidor.channel-settings.channel-overview-section.label--6">Taxa de bits — {Math.round(bitrate / 1000)} kbps</Label>
              <Slider data-gc="servidor.channel-settings.channel-overview-section.slider"
                min={8000}
                max={96000}
                step={8000}
                value={bitrate}
                filled={(bitrate - 8000) / 88000}
                onChange={(e) => setBitrate(Number(e.target.value))}
              />
              <p data-gc="servidor.channel-settings.channel-overview-section.p--3" className="mt-1.5 text-xs text-ink-faint">
                {t("servidor.canal.bitrateDica")}
              </p>
            </div>

            <div data-gc="servidor.channel-settings.channel-overview-section.div--10">
              <Label data-gc="servidor.channel-settings.channel-overview-section.label--7">{t("servidor.canal.qualidadeDeVideo")}</Label>
              <SegmentedGroup data-gc="servidor.channel-settings.channel-overview-section.segmented-group.set-video-quality"
                value={videoQuality}
                onSelect={setVideoQuality}
                options={[
                  { value: "AUTO" as const, label: t("servidor.canal.automatica") },
                  { value: "HD" as const, label: "720p" },
                ]}
              />
            </div>

            <div data-gc="servidor.channel-settings.channel-overview-section.div--11">
              <Label data-gc="servidor.channel-settings.channel-overview-section.label--8">
                {t("servidor.canal.limite", {
                  valor: userLimit
                    ? t("servidor.canal.pessoas", { quantos: userLimit })
                    : t("servidor.canal.semLimite"),
                })}
              </Label>
              <Slider data-gc="servidor.channel-settings.channel-overview-section.slider--2"
                min={0}
                max={99}
                step={1}
                value={userLimit}
                filled={userLimit / 99}
                onChange={(e) => setUserLimit(Number(e.target.value))}
              />
            </div>
          </>
        )}
      </div>

      <UnsavedBar data-gc="servidor.channel-settings.channel-overview-section.unsaved-bar"
        visible={changed}
        saving={save.isPending}
        onDiscard={() => {
          setName(channel.name);
          setTopic(channel.topic ?? "");
          setUrl(channel.url ?? "");
          setSlowmode(channel.slowmodeSeconds);
          setVisibility(channel.contentVisibility);
          setBitrate(channel.bitrate);
          setVideoQuality(channel.videoQuality);
          setUserLimit(channel.userLimit);
          setFont(channel.font ?? "padrao");
        }}
        onSave={() =>
          save.mutate({
            guildId,
            channelId: channel.id,
            name: name.trim(),
            font,
            topic: topic.trim() || null,
            ...(isLink ? { url: url.trim() || null } : {}),
            slowmodeSeconds: slowmode,
            contentVisibility: visibility,
            ...(isVoice ? { bitrate, videoQuality, userLimit } : {}),
          })
        }
      />
    </div>
  );
};
