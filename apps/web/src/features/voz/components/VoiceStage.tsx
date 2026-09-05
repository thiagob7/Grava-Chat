import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Monitor, MonitorUp, Play, SignalLow, Volume2, VolumeX, X } from "lucide-react";

import { ChatCircle, SpeakerHigh, UserPlus } from "@phosphor-icons/react";

import { InviteModal } from "~/features/servidor/components/InviteModal";
import { QualidadeDaTela } from "~/features/voz/components/QualidadeDaTela";

import type {
  Channel,
  GuildMember,
  Permission,
  Role,
  VoiceState,
} from "@gravae/shared";

import { useVoicePrefs } from "~/features/voz/stores/voice-prefs";
import { useVoiceStore, type VoiceTile } from "~/features/voz/stores/voice-store";
import { focar, formatoDaGrade, montarGrade } from "~/features/voz/lib/grade-da-call";
import { avisoDeQualidade } from "~/features/voz/lib/qualidade-da-conexao";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Slider } from "~/components/ui/slider";
import { Tooltip } from "~/components/ui/tooltip";
import { Avatar } from "~/features/perfil/components/Avatar";
import { UserProfilePopover } from "~/features/perfil/components/UserProfilePopover";
import { VoiceMemberMenu } from "~/features/voz/components/VoiceMemberMenu";
import { VoiceStageControls } from "~/features/voz/components/VoiceStageControls";
import { VoiceVideo } from "~/features/voz/components/VoiceTrack";
import { useParticipante } from "~/features/voz/hooks/use-participante";
import { useSomDoPainel } from "~/features/voz/lib/soundboard";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

interface VoiceStageProps {
  channelName: string;
  guildId?: string;
  members?: GuildMember[];
  roles?: Role[];
  canaisDeVoz?: Channel[];
  voiceStates?: VoiceState[];
  minhasPermissoes?: Permission[];
  currentUserId?: string;
  compacto?: boolean;
  guildName?: string;
  chatAberto?: boolean;
  onAlternarChat?: () => void;
  podeConvidar?: boolean;
}

const CantosDaChamada: React.FC<{
  nome: string;
  chatAberto?: boolean;
  onAlternarChat?: () => void;
  onConvidar?: () => void;
}> = ({ nome, chatAberto, onAlternarChat, onConvidar }) => {
  const { t } = useTranslation();

  const botao =
    "pointer-events-auto flex size-[2.125rem] shrink-0 items-center justify-center rounded-[0.8125rem] border border-white/[0.08] bg-black text-white/[0.84] shadow-[inset_0_1px_0_rgba(255,255,255,0.055)] transition-colors duration-75 hover:border-white/[0.14] hover:bg-[#111] hover:text-white aria-pressed:border-white/[0.14] aria-pressed:bg-[#111] aria-pressed:text-white";

  return (
    <>
      <div data-gc="voz.voice-stage.div"
        className={cn(
          "regiao-de-arrasto pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 p-3",
          "opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100",
        )}
      >
        <span data-gc="voz.voice-stage.span" className="flex min-w-0 items-center gap-2 text-sm font-semibold text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.9)]">
          <SpeakerHigh data-gc="voz.voice-stage.speaker-high"
            size={20}
            weight="fill"
            className="shrink-0 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
          />
          <span data-gc="voz.voice-stage.span--2" className="truncate">{nome}</span>
        </span>

        {onAlternarChat && (
          <Tooltip data-gc="voz.voice-stage.tooltip"
            label={chatAberto ? t("chamada.fecharChat") : t("chamada.mostrarChat")}
            side="left"
          >
            <button data-gc="voz.voice-stage.button.on-alternar-chat"
              onClick={onAlternarChat}
              aria-pressed={chatAberto}
              aria-label={chatAberto ? t("chamada.fecharChat") : t("chamada.mostrarChat")}
              className={botao}
            >
              <ChatCircle data-gc="voz.voice-stage.chat-circle" size={20} weight="fill" />
            </button>
          </Tooltip>
        )}
      </div>

      {onConvidar && (
        <Tooltip data-gc="voz.voice-stage.tooltip--2" label={t("chamada.convidar")} side="right">
          <button data-gc="voz.voice-stage.button.on-convidar"
            onClick={onConvidar}
            aria-label={t("chamada.convidar")}
            className={cn(
              botao,
              "absolute bottom-4 left-4 z-10",
              "opacity-0 transition-opacity duration-150 focus-visible:opacity-100 group-hover:opacity-100",
            )}
          >
            <UserPlus data-gc="voz.voice-stage.user-plus" size={20} weight="fill" />
          </button>
        </Tooltip>
      )}
    </>
  );
};

const espacoDaGrade = (quadros: number) => {
  if (quadros >= 40) return 4;
  if (quadros >= 24) return 6;
  if (quadros >= 12) return 8;
  if (quadros >= 6) return 10;
  return 12;
};

export const VoiceStage: React.FC<VoiceStageProps> = ({
  channelName,
  guildId,
  members = [],
  roles = [],
  canaisDeVoz = [],
  voiceStates = [],
  minhasPermissoes = [],
  currentUserId,
  compacto = false,
  guildName,
  chatAberto,
  onAlternarChat,
  podeConvidar = false,
}) => {
  const { t } = useTranslation();
  const palco = useRef<HTMLDivElement>(null);
  const quadro = useRef<HTMLDivElement>(null);
  const [focado, setFocado] = useState<string | null>(null);
  const [convidando, setConvidando] = useState(false);

  const todosOsTiles = useVoiceStore((s) => s.tiles);
  const mostrarSemVideo = useVoicePrefs((s) => s.mostrarSemVideo);

  const tiles = mostrarSemVideo
    ? todosOsTiles
    : todosOsTiles.filter((t) => t.isLocal || t.cameraTrack || t.screenTrack);
  const connecting = useVoiceStore((s) => s.connecting);

  const assistindo = useVoiceStore((s) => s.assistindo);
  const setAssistindo = useVoiceStore((s) => s.assistir);
  const definirPalcoVisivel = useVoiceStore((s) => s.definirPalcoVisivel);

  useEffect(() => {
    definirPalcoVisivel(true);
    return () => definirPalcoVisivel(false);
  }, [definirPalcoVisivel]);
  const error = useVoiceStore((s) => s.error);

  if (error) {
    return (
      <div data-gc="voz.voice-stage.div--2" className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <p data-gc="voz.voice-stage.p" className="font-medium text-danger">{t("chamada.naoEntrou")}</p>
        <p data-gc="voz.voice-stage.p--2" className="max-w-sm text-sm text-ink-muted">{error}</p>
      </div>
    );
  }

  if (connecting) {
    return (
      <div data-gc="voz.voice-stage.div--3" className="flex flex-1 items-center justify-center text-ink-muted">
        {t("chamada.conectando")}
      </div>
    );
  }

  const sharing = assistindo
    ? tiles.find((t) => t.identity === assistindo && t.screenTrack)
    : null;

  const contexto = {
    guildId,
    members,
    roles,
    canaisDeVoz,
    voiceStates,
    minhasPermissoes,
    currentUserId,
  };

  if (sharing) {
    return (
      <div data-gc="voz.voice-stage.div--4"
        ref={palco}
        className={cn(
          "group relative flex min-h-0 flex-1 overflow-hidden bg-black",
          compacto ? "flex-row gap-2 p-2" : "flex-col",
        )}
      >
        <div data-gc="voz.voice-stage.div--5" ref={quadro} className="relative min-w-0 flex-1 overflow-hidden bg-black">
          <button data-gc="voz.voice-stage.button"
            onClick={() => setAssistindo(null)}
            aria-label={t("chamada.voltarAosQuadros")}
            className="absolute inset-0 size-full cursor-pointer"
          >
            <VoiceVideo data-gc="voz.voice-stage.voice-video" track={sharing.screenTrack!} />
          </button>

          <div data-gc="voz.voice-stage.div--6"
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 flex items-center gap-2 bg-gradient-to-b from-black/80 to-transparent px-4",
              compacto ? "pb-6 pt-2" : "pb-8 pt-3",
            )}
          >
            {!compacto && (
              <>
                <MonitorUp data-gc="voz.voice-stage.monitor-up" size={14} className="shrink-0 text-white/70" />
                <span data-gc="voz.voice-stage.span--3" className="text-sm font-medium">Tela de {sharing.name}</span>
                <QualidadeDaTela data-gc="voz.voice-stage.qualidade-da-tela" track={sharing.screenTrack!} />
              </>
            )}

            <span data-gc="voz.voice-stage.span--4" className="ml-auto rounded bg-danger px-1.5 py-0.5 text-10 font-bold tracking-wide">
              {t("chamada.live.etiquetaMaiuscula")}
            </span>

            <button data-gc="voz.voice-stage.button--2"
              onClick={() => setAssistindo(null)}
              className="pointer-events-auto flex shrink-0 items-center gap-1.5 rounded bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition hover:bg-white/25"
            >
              <X data-gc="voz.voice-stage.x" size={14} /> {t("chamada.live.pararDeAssistir")}
            </button>
          </div>

          {!compacto && (
            <div data-gc="voz.voice-stage.div--7" className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-10">
              <div data-gc="voz.voice-stage.div--8" className="flex shrink-0 gap-2">
                {tiles.map((tile) => (
                  <ComMenu data-gc="voz.voice-stage.com-menu" key={tile.identity} tile={tile} contexto={contexto}>
                    <Tile data-gc="voz.voice-stage.tile" tile={tile} guildId={guildId} compact />
                  </ComMenu>
                ))}
              </div>
            </div>
          )}
        </div>

        {compacto && (
          <div data-gc="voz.voice-stage.div--9" className="flex w-16 shrink-0 flex-col items-center gap-3 overflow-y-auto py-1">
            {tiles.map((tile) => (
              <ComMenu data-gc="voz.voice-stage.com-menu--2" key={tile.identity} tile={tile} contexto={contexto}>
                <RostoDaColuna data-gc="voz.voice-stage.rosto-da-coluna" tile={tile} />
              </ComMenu>
            ))}
          </div>
        )}

        <VoiceStageControls data-gc="voz.voice-stage.voice-stage-controls" alvoTelaCheia={palco} mostrarChat={compacto} />
      </div>
    );
  }

  const grade = montarGrade(
    tiles.map((tile) => ({ identity: tile.identity, transmitindo: Boolean(tile.screenTrack), tile })),
  );

  const { colunas, denso } = formatoDaGrade(grade.length);
  const emFoco = focar(grade, focado);

  const ampliado = emFoco?.faixa.length === 0;

  const desenhar = (
    quadro: (typeof grade)[number],
    compacto?: boolean,
    preencher?: boolean,
    semCanto?: boolean,
  ) =>
    quadro.tipo === "tela" ? (
      <TileDaLive data-gc="voz.voice-stage.tile-da-live"
        key={quadro.key}
        tile={quadro.de.tile}
        denso={denso || compacto}
        className={preencher ? "size-full" : undefined}
        onAssistir={() => setAssistindo(quadro.de.identity)}
      />
    ) : (
      <ComMenu data-gc="voz.voice-stage.com-menu--3" key={quadro.key} tile={quadro.de.tile} contexto={contexto}>
        <Tile data-gc="voz.voice-stage.tile--2"
          tile={quadro.de.tile}
          guildId={guildId}
          denso={denso || compacto}
          preencher={preencher}
          semCanto={semCanto}
          onFocar={() => setFocado((atual) => (atual === quadro.key ? null : quadro.key))}
        />
      </ComMenu>
    );

  if (emFoco && emFoco.faixa.length) {
    return (
      <div data-gc="voz.voice-stage.div--10"
        ref={palco}
        className={cn(
          "group relative flex min-h-0 flex-1 flex-col gap-3 overflow-hidden bg-surface-2 pb-20",
          compacto ? "p-4 pb-20" : "px-4 pt-14",
        )}
      >
        {!compacto && (
          <CantosDaChamada data-gc="voz.voice-stage.cantos-da-chamada.on-alternar-chat"
            nome={channelName}
            chatAberto={chatAberto}
            onAlternarChat={onAlternarChat}
            onConvidar={podeConvidar ? () => setConvidando(true) : undefined}
          />
        )}

        <div data-gc="voz.voice-stage.div--11" className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-surface-2">
          <div data-gc="voz.voice-stage.div--12" className="aspect-video w-full max-h-full [&>*]:size-full">
            {desenhar(emFoco.destaque, false, true)}
          </div>
        </div>

        <div data-gc="voz.voice-stage.div--13" className="flex shrink-0 justify-center gap-2">
          {emFoco.faixa.map((quadro) => (
            <div data-gc="voz.voice-stage.div--14" key={quadro.key} className="w-40 shrink-0">
              {desenhar(quadro, true)}
            </div>
          ))}
        </div>

        <VoiceStageControls data-gc="voz.voice-stage.voice-stage-controls--2" alvoTelaCheia={palco} mostrarChat={compacto} />

        <InviteModal data-gc="voz.voice-stage.invite-modal"
          open={convidando}
          guildId={guildId}
          guildName={guildName}
          onClose={() => setConvidando(false)}
        />
      </div>
    );
  }

  if (compacto) {
    return (
      <div data-gc="voz.voice-stage.div--15"
        ref={palco}
        className="group relative flex min-h-0 flex-1 items-center justify-center gap-5 overflow-hidden bg-surface-2 p-4 pb-20"
      >
        {grade.map((quadro) => (
          <div data-gc="voz.voice-stage.div--16" key={quadro.key} className="h-full max-h-56 min-w-0 max-w-md flex-1">
            {desenhar(quadro, false, true)}
          </div>
        ))}

        {!tiles.length && <p data-gc="voz.voice-stage.p--3" className="text-ink-muted">Ninguém em {channelName} ainda.</p>}

        <VoiceStageControls data-gc="voz.voice-stage.voice-stage-controls--3" alvoTelaCheia={palco} mostrarChat={compacto} />
      </div>
    );
  }

  return (
    <div data-gc="voz.voice-stage.div--17"
      ref={palco}
      className={cn(
        "group relative flex min-h-0 flex-1 items-center justify-center overflow-hidden",
        ampliado
          ? "palco-de-um bg-surface-2"
          : grade.length === 1
            ? "palco-de-um bg-surface-2 px-3 pb-20 pt-3.5"
            : "palco-de-um bg-surface-2 px-3 pb-20 pt-3.5",
      )}
    >
        <CantosDaChamada data-gc="voz.voice-stage.cantos-da-chamada.on-alternar-chat--2"
          nome={channelName}
          chatAberto={chatAberto}
          onAlternarChat={onAlternarChat}
          onConvidar={podeConvidar ? () => setConvidando(true) : undefined}
        />

      <div data-gc="voz.voice-stage.div--18"
        className={cn(
          grade.length > 1 && "grade-de-varios",
          grade.length === 1 && "grid max-h-full quadro-de-um [&>*]:size-full",
          ampliado && "quadro-de-um-ampliado",
        )}
        style={
          grade.length > 1
            ? 
              ({
                "--colunas": colunas,
                "--linhas": Math.ceil(grade.length / colunas),
                "--espaco": `${espacoDaGrade(grade.length)}px`,
              } as React.CSSProperties)
            : { gridTemplateColumns: "repeat(1, minmax(0, 1fr))", gridAutoRows: "minmax(0, 1fr)" }
        }
      >
        {grade.map((quadro) => desenhar(quadro, false, grade.length === 1, ampliado))}
      </div>
      {!tiles.length && (
        <p data-gc="voz.voice-stage.p--4" className="text-ink-muted">Ninguém em {channelName} ainda.</p>
      )}

      <VoiceStageControls data-gc="voz.voice-stage.voice-stage-controls--4" alvoTelaCheia={palco} mostrarChat={compacto} />

      <InviteModal data-gc="voz.voice-stage.invite-modal--2"
        open={convidando}
        guildId={guildId}
        guildName={guildName}
        onClose={() => setConvidando(false)}
      />
    </div>
  );
};

interface TileProps {
  tile: VoiceTile;
  guildId?: string;
  compact?: boolean;
  denso?: boolean;
  preencher?: boolean;
  semCanto?: boolean;
  onFocar?: () => void;
}

const Tile: React.FC<TileProps> = ({
  tile,
  guildId,
  compact,
  denso,
  preencher,
  semCanto,
  onFocar,
}) => {
  const { t } = useTranslation();
  const resolver = useParticipante();
  const espelhar = useVoicePrefs((s) => s.espelharCamera);
  const tocandoSom = useSomDoPainel((s) => s.quem === tile.identity);
  const falando = tile.speaking || tocandoSom;
  const participante = resolver(tile.identity, {
    name: tile.name,
    avatarUrl: tile.avatarUrl,
  });

  return (
    <div data-gc="voz.voice-stage.div.on-focar"
      onClick={onFocar}
      className={cn(
        "group/tile relative flex items-center justify-center overflow-hidden bg-surface-1 transition",
        !semCanto && "rounded-xl",
        onFocar && "cursor-pointer",
        compact ? "h-16 w-24 shrink-0" : preencher ? "size-full" : "aspect-video",
      )}
    >
      {tile.cameraTrack ? (
        <div data-gc="voz.voice-stage.div--19" className={cn("size-full", falando && "ring-2 ring-online")}>
          <VoiceVideo data-gc="voz.voice-stage.voice-video--2" track={tile.cameraTrack} mirrored={tile.isLocal && espelhar} />
        </div>
      ) : (
        <Avatar data-gc="voz.voice-stage.avatar"
          id={tile.identity}
          name={participante.nome}
          url={participante.avatarUrl}
          size={compact ? 44 : denso ? 52 : 80}
          enfeites={participante.perfil}
          animar={falando}
        />
      )}

      <div data-gc="voz.voice-stage.div--20"
        className={cn(
          "absolute bottom-1.5 left-1.5 flex max-w-[calc(100%-0.75rem)] items-center gap-1 rounded bg-black/60 px-1.5 py-0.5",
          !compact && "bottom-2 left-2 gap-1.5 px-2 py-1",
        )}
      >
        {tile.micEnabled ? (
          <Mic data-gc="voz.voice-stage.mic" size={12} className="shrink-0 text-ink-muted" />
        ) : (
          <MicOff data-gc="voz.voice-stage.mic-off" size={12} className="shrink-0 text-danger" />
        )}

        <AvisoDeConexao data-gc="voz.voice-stage.aviso-de-conexao" qualidade={tile.qualidade} />
        <UserProfilePopover data-gc="voz.voice-stage.user-profile-popover" userId={tile.identity} guildId={guildId} side="top">
          <button data-gc="voz.voice-stage.button--3"
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "min-w-0 truncate whitespace-nowrap font-medium hover:underline",
              compact
                ? "w-0 overflow-hidden text-10 opacity-0 transition-all group-hover/tile:w-auto group-hover/tile:opacity-100"
                : "text-xs",
            )}
          >
            {participante.nome}
            {tile.isLocal && " (você)"}
          </button>
        </UserProfilePopover>
      </div>
    </div>
  );
};

const TileDaLive: React.FC<{
  tile: VoiceTile;
  denso?: boolean;
  onAssistir: () => void;
  className?: string;
}> = ({ tile, denso, onAssistir, className }) => {
  const { t } = useTranslation();

  return (
  <div data-gc="voz.voice-stage.div--21"
    className={cn(
      "group/live relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-black/70 ring-1 ring-white/10",
      className,
    )}
  >
    {tile.isLocal && tile.screenTrack ? (
      <button data-gc="voz.voice-stage.button.on-assistir" onClick={onAssistir} className="absolute inset-0 size-full">
        <VoiceVideo data-gc="voz.voice-stage.voice-video--3" track={tile.screenTrack} />

        <span data-gc="voz.voice-stage.span--5" className="pointer-events-none absolute right-2 top-2 flex items-center gap-1.5 rounded-full bg-danger px-2 py-0.5 text-10 font-bold uppercase tracking-wide text-white">
          <span data-gc="voz.voice-stage.span--6" className="size-1.5 animate-pulse rounded-full bg-white" /> {t("chamada.live.etiqueta")}
        </span>
      </button>
    ) : (
      <button data-gc="voz.voice-stage.button.on-assistir--2"
        onClick={onAssistir}
        className="absolute inset-0 flex items-center justify-center transition hover:bg-white/5"
      >
        <span data-gc="voz.voice-stage.span--7" className="absolute right-2 top-2 flex items-center gap-1.5 rounded-full bg-danger px-2 py-0.5 text-10 font-bold uppercase tracking-wide text-white">
          <span data-gc="voz.voice-stage.span--8" className="size-1.5 animate-pulse rounded-full bg-white" /> {t("chamada.live.etiqueta")}
        </span>

        <span data-gc="voz.voice-stage.span--9"
          title={t("chamada.live.assistir")}
          className={cn(
            "flex items-center justify-center bg-brand font-medium text-white shadow-lg",
            "opacity-0 transition group-hover/live:opacity-100",
            denso
              ? "size-9 rounded-full"
              : "gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm",
          )}
        >
          <Play data-gc="voz.voice-stage.play" size={denso ? 16 : 16} />
          {!denso && t("chamada.live.assistir")}
        </span>
      </button>
    )}

    <div data-gc="voz.voice-stage.div--22" className="pointer-events-none absolute bottom-2 left-2 flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded bg-black/60 px-2 py-1">
      <Monitor data-gc="voz.voice-stage.monitor" size={12} className="shrink-0 text-online" />
      <span data-gc="voz.voice-stage.span--10" className="min-w-0 truncate whitespace-nowrap text-xs font-medium">
        {tile.name}
        {tile.isLocal && " (sua tela)"}
      </span>
    </div>

    {!tile.isLocal && <ControleDeVolumeDaLive data-gc="voz.voice-stage.controle-de-volume-da-live" identity={tile.identity} className="absolute bottom-2 right-2" />}
  </div>
  );
};

const ControleDeVolumeDaLive: React.FC<{ identity: string; className?: string }> = ({
  identity,
  className,
}) => {
  const volume = useVoiceStore((s) => Math.min(1, s.volumesDeTela[identity] ?? 1));
  const definir = useVoiceStore((s) => s.setVolumeDeTela);

  return (
    <Popover data-gc="voz.voice-stage.popover">
      <Tooltip data-gc="voz.voice-stage.tooltip--3" label={volume === 0 ? "Live sem som" : `Volume da live · ${Math.round(volume * 100)}%`}>
        <PopoverTrigger data-gc="voz.voice-stage.popover-trigger" asChild>
          <button data-gc="voz.voice-stage.button--4"
            aria-label="Volume da live"
            className={cn(
              "pointer-events-auto rounded bg-black/60 p-1.5 text-white/80 transition hover:bg-black/80 hover:text-white",
              className,
            )}
          >
            {volume === 0 ? <VolumeX data-gc="voz.voice-stage.volume-x" size={14} className="text-danger" /> : <Volume2 data-gc="voz.voice-stage.volume2" size={14} />}
          </button>
        </PopoverTrigger>
      </Tooltip>

      <PopoverContent data-gc="voz.voice-stage.popover-content" side="top" align="end" className="w-48 p-3">
        <p data-gc="voz.voice-stage.p--5" className="mb-2 text-xs font-medium text-ink-muted">
          Volume da live · {Math.round(volume * 100)}%
        </p>

        <Slider data-gc="voz.voice-stage.slider"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          preenchido={volume}
          onChange={(e) => definir(identity, Number(e.target.value))}
        />
      </PopoverContent>
    </Popover>
  );
};

const AvisoDeConexao: React.FC<{ qualidade: string }> = ({ qualidade }) => {
  const aviso = avisoDeQualidade(qualidade);
  if (!aviso) return null;

  return (
    <Tooltip data-gc="voz.voice-stage.tooltip--4" label={aviso.rotulo}>
      <span data-gc="voz.voice-stage.span--11" className={cn("flex shrink-0 items-center", aviso.cor)} aria-label={aviso.rotulo}>
        <SignalLow data-gc="voz.voice-stage.signal-low" size={12} className={aviso.pulsando ? "animate-pulse" : undefined} />
      </span>
    </Tooltip>
  );
};

const RostoDaColuna: React.FC<{ tile: VoiceTile }> = ({ tile }) => {
  const espelhar = useVoicePrefs((s) => s.espelharCamera);
  const tocandoSom = useSomDoPainel((s) => s.quem === tile.identity);
  const falando = tile.speaking || tocandoSom;
  const resolver = useParticipante();
  const participante = resolver(tile.identity, { name: tile.name, avatarUrl: tile.avatarUrl });

  return (
    <div data-gc="voz.voice-stage.div--23" className="relative shrink-0" title={participante.nome}>
      {tile.cameraTrack ? (
        <div data-gc="voz.voice-stage.div--24" className="size-11 overflow-hidden rounded-full">
          <VoiceVideo data-gc="voz.voice-stage.voice-video--4" track={tile.cameraTrack} mirrored={tile.isLocal && espelhar} />
        </div>
      ) : (
        <Avatar data-gc="voz.voice-stage.avatar--2"
          id={tile.identity}
          name={participante.nome}
          url={participante.avatarUrl}
          size={44}
          enfeites={participante.perfil}
          animar={falando}
        />
      )}

      {!tile.micEnabled && (
        <span data-gc="voz.voice-stage.span--12" className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-surface-0 ring-2 ring-surface-2">
          <MicOff data-gc="voz.voice-stage.mic-off--2" size={9} className="text-danger" />
        </span>
      )}
    </div>
  );
};

interface ContextoDoPalco {
  guildId?: string;
  members: GuildMember[];
  roles: Role[];
  canaisDeVoz: Channel[];
  voiceStates: VoiceState[];
  minhasPermissoes: Permission[];
  currentUserId?: string;
}

const ComMenu: React.FC<{
  tile: VoiceTile;
  contexto: ContextoDoPalco;
  children: React.ReactNode;
}> = ({ tile, contexto, children }) => {
  if (!contexto.guildId) return <>{children}</>;

  return (
    <VoiceMemberMenu data-gc="voz.voice-stage.voice-member-menu"
      guildId={contexto.guildId}
      userId={tile.identity}
      displayName={
        contexto.members.find((m) => m.user.id === tile.identity)?.user.displayName ?? tile.name
      }
      voiceState={contexto.voiceStates.find((v) => v.userId === tile.identity)}
      member={contexto.members.find((m) => m.user.id === tile.identity)}
      roles={contexto.roles}
      canaisDeVoz={contexto.canaisDeVoz}
      minhasPermissoes={contexto.minhasPermissoes}
      currentUserId={contexto.currentUserId}
    >
      <div data-gc="voz.voice-stage.div--25">{children}</div>
    </VoiceMemberMenu>
  );
};
