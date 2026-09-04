import React, { useState } from "react";
import type { Channel, FonteDeNome } from "@gravae/shared";
import { MODO_LENTO_OPCOES } from "@gravae/shared";

import { useUpdateChannel } from "~/@core/application/queries/guild/use-update-channel";
import { Button } from "~/components/ui/button";
import { CampoSelect } from "~/components/ui/select";
import { UnsavedBar } from "~/components/ui/unsaved-bar";
import { GrupoSegmentado, Label, OpcaoEmCartao, Textarea } from "~/components/ui/input";
import { CampoDeNomeDeCanal } from "~/components/CampoDeNomeDeCanal";
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
    <div className="max-w-2xl pb-10">
      <h2 className="text-xl font-semibold">{t("servidor.canal.visaoGeral")}</h2>

      <div className="mt-6 space-y-6">
        <div>
          <Label htmlFor="canal-nome">{t("servidor.canal.nome")}</Label>
          <CampoDeNomeDeCanal
            id="canal-nome"
            valor={name}
            onMudar={setName}
            fonte={fonte}
            onFonte={setFonte}
            ehVoz={ehVoz}
          />
        </div>

        {!ehVoz && (
          <div>
            <Label htmlFor="canal-topico">{t("servidor.canal.topico")}</Label>
            <Textarea
              id="canal-topico"
              value={topic}
              maxLength={512}
              rows={3}
              placeholder={t("servidor.canal.topicoDica")}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
        )}

        <div>
          <Label htmlFor="modo-lento">Modo lento — {rotuloDoModoLento(slowmode)}</Label>
          <CampoSelect
            id="modo-lento"
            valor={slowmode}
            onEscolher={setSlowmode}
            opcoes={MODO_LENTO_OPCOES.map((segundos) => ({
              valor: segundos,
              rotulo: rotuloDoModoLento(segundos),
            }))}
          />
          <p className="mt-1.5 text-xs text-ink-faint">
            {t("servidor.canal.modoLento")}
          </p>
        </div>

        <div>
          <Label>{t("servidor.canal.visibilidade")}</Label>
          <div className="space-y-2">
            {VISIBILIDADES.map((opcao) => (
              <OpcaoEmCartao
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
            <div>
              <Label>Taxa de bits — {Math.round(bitrate / 1000)} kbps</Label>
              <Slider
                min={8000}
                max={96000}
                step={8000}
                value={bitrate}
                preenchido={(bitrate - 8000) / 88000}
                onChange={(e) => setBitrate(Number(e.target.value))}
              />
              <p className="mt-1.5 text-xs text-ink-faint">
                {t("servidor.canal.bitrateDica")}
              </p>
            </div>

            <div>
              <Label>{t("servidor.canal.qualidadeDeVideo")}</Label>
              <GrupoSegmentado
                valor={videoQuality}
                onEscolher={setVideoQuality}
                opcoes={[
                  { valor: "AUTO" as const, rotulo: t("servidor.canal.automatica") },
                  { valor: "HD" as const, rotulo: "720p" },
                ]}
              />
            </div>

            <div>
              <Label>
                {t("servidor.canal.limite", {
                  valor: userLimit
                    ? t("servidor.canal.pessoas", { quantos: userLimit })
                    : t("servidor.canal.semLimite"),
                })}
              </Label>
              <Slider
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

      <UnsavedBar
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
