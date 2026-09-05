import React, { useState } from "react";
import type { Channel, FonteDeNome } from "@gravae/shared";
import { MODO_LENTO_OPCOES } from "@gravae/shared";

import { useUpdateChannel } from "~/@core/application/queries/guild/use-update-channel";
import { Button } from "~/components/ui/button";
import { CampoSelect } from "~/components/ui/select";
import { UnsavedBar } from "~/components/ui/unsaved-bar";
import { GrupoSegmentado, Label, OpcaoEmCartao, Textarea } from "~/components/ui/input";
import { CampoDeNomeDeCanal } from "~/features/servidor/components/CampoDeNomeDeCanal";
import { Slider } from "~/components/ui/slider";
import { useTranslation } from "~/traducao";

interface ChannelOverviewSectionProps {
  guildId: string;
  channel: Channel;
}

function rotuloDoModoLento(segundos: number) {
  if (!segundos) return "Desligado";
  if (segundos < 60) return `${segundos}s`;
  if (segundos < 3600) return `${segundos / 60} min`;
  return `${segundos / 3600} h`;
}

const VISIBILIDADES = [
  {
    valor: "DEFAULT" as const,
    titulo: "servidor.canal.padrao",
    descricao: "servidor.canal.padraoDica",
  },
  {
    valor: "SPOILER" as const,
    titulo: "servidor.canal.spoiler",
    descricao: "servidor.canal.spoilerDica",
  },
  {
    valor: "AGE_RESTRICTED" as const,
    titulo: "servidor.canal.idade",
    descricao: "servidor.canal.idadeDica",
  },
];

export const ChannelOverviewSection: React.FC<ChannelOverviewSectionProps> = ({
  guildId,
  channel,
}) => {
  const { t } = useTranslation();
  const salvar = useUpdateChannel(guildId);

  const [name, setName] = useState(channel.name);
  const [fonte, setFonte] = useState<FonteDeNome>(channel.fonte ?? "padrao");
  const [topic, setTopic] = useState(channel.topic ?? "");
  const [slowmode, setSlowmode] = useState(channel.slowmodeSeconds);
  const [visibilidade, setVisibilidade] = useState(channel.contentVisibility);
  const [bitrate, setBitrate] = useState(channel.bitrate);
  const [videoQuality, setVideoQuality] = useState(channel.videoQuality);
  const [userLimit, setUserLimit] = useState(channel.userLimit);

  const ehVoz = channel.type === "VOICE";

  const mudou =
    name !== channel.name ||
    fonte !== (channel.fonte ?? "padrao") ||
    (topic || null) !== (channel.topic ?? null) ||
    slowmode !== channel.slowmodeSeconds ||
    visibilidade !== channel.contentVisibility ||
    bitrate !== channel.bitrate ||
    videoQuality !== channel.videoQuality ||
    userLimit !== channel.userLimit;

  return (
    <div data-gc="servidor.channel-settings.channel-overview-section.div" className="max-w-2xl pb-10">
      <h2 data-gc="servidor.channel-settings.channel-overview-section.h2" className="text-xl font-semibold">{t("servidor.canal.visaoGeral")}</h2>

      <div data-gc="servidor.channel-settings.channel-overview-section.div--2" className="mt-6 space-y-6">
        <div data-gc="servidor.channel-settings.channel-overview-section.div--3">
          <Label data-gc="servidor.channel-settings.channel-overview-section.label" htmlFor="canal-nome">{t("servidor.canal.nome")}</Label>
          <CampoDeNomeDeCanal data-gc="servidor.channel-settings.channel-overview-section.campo-de-nome-de-canal.set-name"
            id="canal-nome"
            valor={name}
            onMudar={setName}
            fonte={fonte}
            onFonte={setFonte}
            ehVoz={ehVoz}
          />
        </div>

        {!ehVoz && (
          <div data-gc="servidor.channel-settings.channel-overview-section.div--4">
            <Label data-gc="servidor.channel-settings.channel-overview-section.label--2" htmlFor="canal-topico">{t("servidor.canal.topico")}</Label>
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

        <div data-gc="servidor.channel-settings.channel-overview-section.div--5">
          <Label data-gc="servidor.channel-settings.channel-overview-section.label--3" htmlFor="modo-lento">Modo lento — {rotuloDoModoLento(slowmode)}</Label>
          <CampoSelect data-gc="servidor.channel-settings.channel-overview-section.campo-select.set-slowmode"
            id="modo-lento"
            valor={slowmode}
            onEscolher={setSlowmode}
            opcoes={MODO_LENTO_OPCOES.map((segundos) => ({
              valor: segundos,
              rotulo: rotuloDoModoLento(segundos),
            }))}
          />
          <p data-gc="servidor.channel-settings.channel-overview-section.p" className="mt-1.5 text-xs text-ink-faint">
            {t("servidor.canal.modoLento")}
          </p>
        </div>

        <div data-gc="servidor.channel-settings.channel-overview-section.div--6">
          <Label data-gc="servidor.channel-settings.channel-overview-section.label--4">{t("servidor.canal.visibilidade")}</Label>
          <div data-gc="servidor.channel-settings.channel-overview-section.div--7" className="space-y-2">
            {VISIBILIDADES.map((opcao) => (
              <OpcaoEmCartao data-gc="servidor.channel-settings.channel-overview-section.opcao-em-cartao"
                key={opcao.valor}
                escolhido={visibilidade === opcao.valor}
                onEscolher={() => setVisibilidade(opcao.valor)}
                titulo={t(opcao.titulo)}
                descricao={t(opcao.descricao)}
              />
            ))}
          </div>
        </div>

        {ehVoz && (
          <>
            <div data-gc="servidor.channel-settings.channel-overview-section.div--8">
              <Label data-gc="servidor.channel-settings.channel-overview-section.label--5">Taxa de bits — {Math.round(bitrate / 1000)} kbps</Label>
              <Slider data-gc="servidor.channel-settings.channel-overview-section.slider"
                min={8000}
                max={96000}
                step={8000}
                value={bitrate}
                preenchido={(bitrate - 8000) / 88000}
                onChange={(e) => setBitrate(Number(e.target.value))}
              />
              <p data-gc="servidor.channel-settings.channel-overview-section.p--2" className="mt-1.5 text-xs text-ink-faint">
                {t("servidor.canal.bitrateDica")}
              </p>
            </div>

            <div data-gc="servidor.channel-settings.channel-overview-section.div--9">
              <Label data-gc="servidor.channel-settings.channel-overview-section.label--6">{t("servidor.canal.qualidadeDeVideo")}</Label>
              <GrupoSegmentado data-gc="servidor.channel-settings.channel-overview-section.grupo-segmentado.set-video-quality"
                valor={videoQuality}
                onEscolher={setVideoQuality}
                opcoes={[
                  { valor: "AUTO" as const, rotulo: t("servidor.canal.automatica") },
                  { valor: "HD" as const, rotulo: "720p" },
                ]}
              />
            </div>

            <div data-gc="servidor.channel-settings.channel-overview-section.div--10">
              <Label data-gc="servidor.channel-settings.channel-overview-section.label--7">
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
                preenchido={userLimit / 99}
                onChange={(e) => setUserLimit(Number(e.target.value))}
              />
            </div>
          </>
        )}
      </div>

      <UnsavedBar data-gc="servidor.channel-settings.channel-overview-section.unsaved-bar"
        visivel={mudou}
        salvando={salvar.isPending}
        onDescartar={() => {
          setName(channel.name);
          setTopic(channel.topic ?? "");
          setSlowmode(channel.slowmodeSeconds);
          setVisibilidade(channel.contentVisibility);
          setBitrate(channel.bitrate);
          setVideoQuality(channel.videoQuality);
          setUserLimit(channel.userLimit);
          setFonte(channel.fonte ?? "padrao");
        }}
        onSalvar={() =>
          salvar.mutate({
            guildId,
            channelId: channel.id,
            name: name.trim(),
            fonte,
            topic: topic.trim() || null,
            slowmodeSeconds: slowmode,
            contentVisibility: visibilidade,
            ...(ehVoz ? { bitrate, videoQuality, userLimit } : {}),
          })
        }
      />
    </div>
  );
};
