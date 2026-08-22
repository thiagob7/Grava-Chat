import React, { useState } from "react";
import type { Channel } from "@gravae/shared";
import { MODO_LENTO_OPCOES } from "@gravae/shared";

import { useUpdateChannel } from "~/@core/application/queries/guild/use-update-channel";
import { Button } from "~/components/ui/button";
import { UnsavedBar } from "~/components/ui/unsaved-bar";
import { Input, Label, campoBase } from "~/components/ui/input";
import { Slider } from "~/components/ui/slider";
import { cn } from "~/lib/utils";

interface ChannelOverviewSectionProps {
  guildId: string;
  channel: Channel;
}

/** "Desligado", "5s", "1 min", "6 h" — o rótulo do modo lento. */
function rotuloDoModoLento(segundos: number) {
  if (!segundos) return "Desligado";
  if (segundos < 60) return `${segundos}s`;
  if (segundos < 3600) return `${segundos / 60} min`;
  return `${segundos / 3600} h`;
}

const VISIBILIDADES = [
  {
    valor: "DEFAULT" as const,
    titulo: "Padrão",
    descricao: "O conteúdo do canal fica sempre visível.",
  },
  {
    valor: "SPOILER" as const,
    titulo: "Canal de spoiler",
    descricao:
      "Marque este canal como contendo spoilers, para que plot twists e assuntos pesados fiquem ocultos até alguém escolher ver.",
  },
  {
    valor: "AGE_RESTRICTED" as const,
    titulo: "Canal com restrição de idade",
    descricao: "Quem entrar precisa confirmar que é maior de idade para ver o conteúdo.",
  },
];

export const ChannelOverviewSection: React.FC<ChannelOverviewSectionProps> = ({
  guildId,
  channel,
}) => {
  const salvar = useUpdateChannel(guildId);

  const [name, setName] = useState(channel.name);
  const [topic, setTopic] = useState(channel.topic ?? "");
  const [slowmode, setSlowmode] = useState(channel.slowmodeSeconds);
  const [visibilidade, setVisibilidade] = useState(channel.contentVisibility);
  const [bitrate, setBitrate] = useState(channel.bitrate);
  const [videoQuality, setVideoQuality] = useState(channel.videoQuality);
  const [userLimit, setUserLimit] = useState(channel.userLimit);

  const ehVoz = channel.type === "VOICE";

  const mudou =
    name !== channel.name ||
    (topic || null) !== (channel.topic ?? null) ||
    slowmode !== channel.slowmodeSeconds ||
    visibilidade !== channel.contentVisibility ||
    bitrate !== channel.bitrate ||
    videoQuality !== channel.videoQuality ||
    userLimit !== channel.userLimit;

  return (
    <div className="max-w-2xl pb-10">
      <h2 className="text-xl font-semibold">Visão geral</h2>

      <div className="mt-6 space-y-6">
        <div>
          <Label htmlFor="canal-nome">Nome do canal</Label>
          <Input
            id="canal-nome"
            value={name}
            maxLength={48}
            onChange={(e) => setName(e.target.value.replace(/\s+/g, ehVoz ? " " : "-"))}
          />
        </div>

        {!ehVoz && (
          <div>
            <Label htmlFor="canal-topico">Tópico do canal</Label>
            <textarea
              id="canal-topico"
              value={topic}
              maxLength={512}
              rows={3}
              placeholder="Do que se fala aqui?"
              onChange={(e) => setTopic(e.target.value)}
              className={cn(campoBase, "resize-none")}
            />
          </div>
        )}

        <div>
          <Label htmlFor="modo-lento">Modo lento — {rotuloDoModoLento(slowmode)}</Label>
          <select
            id="modo-lento"
            value={slowmode}
            onChange={(e) => setSlowmode(Number(e.target.value))}
            className={campoBase}
          >
            {MODO_LENTO_OPCOES.map((segundos) => (
              <option key={segundos} value={segundos}>
                {rotuloDoModoLento(segundos)}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-ink-faint">
            Cada pessoa só manda uma mensagem por intervalo. Quem gerencia mensagens ou canais passa
            direto.
          </p>
        </div>

        <div>
          <Label>Visibilidade do conteúdo</Label>
          <div className="space-y-2">
            {VISIBILIDADES.map((opcao) => (
              <button
                key={opcao.valor}
                onClick={() => setVisibilidade(opcao.valor)}
                className={cn(
                  "flex w-full items-start gap-3 rounded px-3 py-2.5 text-left transition",
                  visibilidade === opcao.valor ? "bg-surface-4" : "bg-surface-0 hover:bg-surface-4/60",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 size-4 shrink-0 rounded-full border-2",
                    visibilidade === opcao.valor ? "border-brand bg-brand" : "border-ink-faint",
                  )}
                />
                <span>
                  <span className="block text-sm font-medium">{opcao.titulo}</span>
                  <span className="mt-0.5 block text-xs text-ink-faint">{opcao.descricao}</span>
                </span>
              </button>
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
                Passar de 64 kbps pode atrapalhar quem tem internet ruim.
              </p>
            </div>

            <div>
              <Label>Qualidade do vídeo</Label>
              <div className="flex gap-2">
                {(["AUTO", "HD"] as const).map((valor) => (
                  <button
                    key={valor}
                    onClick={() => setVideoQuality(valor)}
                    className={cn(
                      "flex-1 rounded border px-3 py-2 text-sm transition",
                      videoQuality === valor ? "border-brand bg-surface-0" : "border-line hover:bg-surface-3",
                    )}
                  >
                    {valor === "AUTO" ? "Automática" : "720p"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>
                Limite de usuários — {userLimit ? `${userLimit} pessoas` : "sem limite"}
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
        }}
        onSalvar={() =>
          salvar.mutate({
            guildId,
            channelId: channel.id,
            name: name.trim(),
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
