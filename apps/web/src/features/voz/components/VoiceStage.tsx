import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Monitor, MonitorUp, Play, SignalLow, Volume2, VolumeX, X } from "lucide-react";

import { CaretDown, CaretUp, ChatCircle, PhoneCall, SpeakerHigh, UserPlus, UsersThree } from "@phosphor-icons/react";

import { InviteModal } from "~/features/servidor/components/InviteModal";
import { ScreenQuality } from "~/features/voz/components/QualidadeDaTela";

import type {
  Channel,
  GuildMember,
  Permission,
  Role,
  VoiceState,
} from "@gravae/shared";

import { useVoicePrefs } from "~/features/voz/stores/voice-prefs";
import { useVoiceStore, type VoiceTile } from "~/features/voz/stores/voice-store";
import { focus, formatGrid, buildGrid } from "~/features/voz/lib/grade-da-call";
import { qualityNotice } from "~/features/voz/lib/qualidade-da-conexao";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Slider } from "~/components/ui/slider";
import { Tooltip } from "~/components/ui/tooltip";
import { Avatar } from "~/features/perfil/components/Avatar";
import { UserProfilePopover } from "~/features/perfil/components/UserProfilePopover";
import { VoiceMemberMenu } from "~/features/voz/components/VoiceMemberMenu";
import { BackToCallCard } from "~/features/voz/components/BackToCallCard";
import { CallInviteCard } from "~/features/voz/components/CallInviteCard";
import { VoiceStageControls } from "~/features/voz/components/VoiceStageControls";
import { SpeechWaves } from "~/features/voz/components/OndasDeFala";
import { VoiceVideo } from "~/features/voz/components/VoiceTrack";
import { useParticipant } from "~/features/voz/hooks/use-participante";
import { usePanelSound } from "~/features/voz/lib/soundboard";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";
import { flx, flxAttr, flxCls } from "~/lib/compat-de-tema";

interface VoiceStageProps {
  channelName: string;
  guildId?: string;
  members?: GuildMember[];
  roles?: Role[];
  voiceChannels?: Channel[];
  voiceStates?: VoiceState[];
  minePermissions?: Permission[];
  currentUserId?: string;
  compact?: boolean;
  guildName?: string;
  chatIsOpen?: boolean;
  onToggleChat?: () => void;
  canInvite?: boolean;
}

const CallCorners: React.FC<{
  name: string;
  chatIsOpen?: boolean;
  onToggleChat?: () => void;
  onInvite?: () => void;
}> = ({ name, chatIsOpen, onToggleChat, onInvite }) => {
  const { t } = useTranslation();

  const button = cn(
    flxCls("topCallButton"),
    "pointer-events-auto flex size-[2.125rem] shrink-0 items-center justify-center rounded-[0.8125rem]",
    "border border-line-sutil bg-palco text-palco-ink/[0.84] transition-colors duration-75",
    "shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-palco-ink)_5%,transparent)]",
    "hover:bg-[color-mix(in_srgb,var(--color-palco)_92%,var(--color-palco-ink))] hover:text-palco-ink",
    "aria-pressed:bg-[color-mix(in_srgb,var(--color-palco)_92%,var(--color-palco-ink))] aria-pressed:text-palco-ink",
  );

  return (
    <>
      <div data-gc="voz.voice-stage.div"
        {...flx(
          "callTop",
          cn(
            "regiao-de-arrasto pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 p-3",
            "opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100",
          ),
        )}
      >
        <span data-gc="voz.voice-stage.span" className="flex min-w-0 items-center gap-2 text-sm font-semibold text-palco-ink [text-shadow:0_1px_3px_rgb(0_0_0/0.9)]">
          <SpeakerHigh data-gc="voz.voice-stage.speaker-high"
            size={20}
            weight="fill"
            className="shrink-0 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
          />
          <span data-gc="voz.voice-stage.span--2" className="truncate">{name}</span>
        </span>

        {onToggleChat && (
          <Tooltip data-gc="voz.voice-stage.tooltip"
            label={chatIsOpen ? t("chamada.fecharChat") : t("chamada.mostrarChat")}
            side="left"
          >
            <button data-gc="voz.voice-stage.button.on-toggle-chat"
              onClick={onToggleChat}
              aria-pressed={chatIsOpen}
              aria-label={chatIsOpen ? t("chamada.fecharChat") : t("chamada.mostrarChat")}
              className={button}
            >
              <ChatCircle data-gc="voz.voice-stage.chat-circle" size={20} weight="fill" />
            </button>
          </Tooltip>
        )}
      </div>

      {onInvite && (
        <Tooltip data-gc="voz.voice-stage.tooltip--2" label={t("chamada.convidar")} side="right">
          <button data-gc="voz.voice-stage.button.on-invite"
            onClick={onInvite}
            aria-label={t("chamada.convidar")}
            className={cn(
              button,
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

const gridSpace = (frames: number) => {
  if (frames >= 40) return 4;
  if (frames >= 24) return 6;
  if (frames >= 12) return 8;
  if (frames >= 6) return 10;
  return 12;
};

export const VoiceStage: React.FC<VoiceStageProps> = ({
  channelName,
  guildId,
  members = [],
  roles = [],
  voiceChannels = [],
  voiceStates = [],
  minePermissions = [],
  currentUserId,
  compact = false,
  guildName,
  chatIsOpen,
  onToggleChat,
  canInvite = false,
}) => {
  const { t } = useTranslation();
  const stage = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [hiddenMembers, setMembersHidden] = useState(false);
  const [inviting, setInviting] = useState(false);

  const allTiles = useVoiceStore((s) => s.tiles);
  const showWithoutVideo = useVoicePrefs((s) => s.showWithoutVideo);

  const tiles = showWithoutVideo
    ? allTiles
    : allTiles.filter((t) => t.isLocal || t.cameraTrack || t.screenTrack);
  const connecting = useVoiceStore((s) => s.connecting);

  const watching = useVoiceStore((s) => s.watching);
  const setWatching = useVoiceStore((s) => s.watch);
  const setStageVisible = useVoiceStore((s) => s.setStageVisible);

  useEffect(() => {
    setStageVisible(true);
    return () => setStageVisible(false);
  }, [setStageVisible]);
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

  const sharing = watching
    ? tiles.find((t) => t.identity === watching && t.screenTrack)
    : null;

  const context = {
    guildId,
    members,
    roles,
    voiceChannels,
    voiceStates,
    minePermissions,
    currentUserId,
  };

  if (sharing) {
    return (
      <div data-gc="voz.voice-stage.div--4"
        ref={stage}
        className={cn(
          flxCls("voiceStage"),
          "group relative flex min-h-0 flex-1 overflow-hidden bg-palco",
          compact ? "flex-row gap-2 p-2" : "flex-col",
        )}
      >
        <div data-gc="voz.voice-stage.div--5" ref={frame} className="relative min-w-0 flex-1 overflow-hidden bg-palco">
          <button data-gc="voz.voice-stage.button"
            onClick={() => setWatching(null)}
            aria-label={t("chamada.voltarAosQuadros")}
            className="absolute inset-0 size-full cursor-pointer"
          >
            <VoiceVideo data-gc="voz.voice-stage.voice-video" track={sharing.screenTrack!} />
          </button>

          <div data-gc="voz.voice-stage.div--6"
            {...flx(
              "broadcastInfo",
              cn(
                flxCls("topFaded"),
                "pointer-events-none absolute inset-x-0 top-0 flex items-center gap-2 bg-gradient-to-b from-palco/80 to-transparent px-4",
                compact ? "pb-6 pt-2" : "pb-8 pt-3",
              ),
            )}
          >
            {!compact && (
              <>
                <MonitorUp data-gc="voz.voice-stage.monitor-up" size={14} className="shrink-0 text-palco-ink/70" />
                <span data-gc="voz.voice-stage.span--3" {...flx("whoBroadcastsName", "text-sm font-medium")}>
                  Tela de {sharing.name}
                </span>
                <ScreenQuality data-gc="voz.voice-stage.screen-quality" track={sharing.screenTrack!} />
              </>
            )}

            <span data-gc="voz.voice-stage.span--4" className="ml-auto rounded bg-danger px-1.5 py-0.5 text-10 font-bold tracking-wide">
              {t("chamada.live.etiquetaMaiuscula")}
            </span>

            <button data-gc="voz.voice-stage.button--2"
              onClick={() => setWatching(null)}
              className="pointer-events-auto flex shrink-0 items-center gap-1.5 rounded bg-palco-ink/15 px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition hover:bg-palco-ink/25"
            >
              <X data-gc="voz.voice-stage.x" size={14} /> {t("chamada.live.pararDeAssistir")}
            </button>
          </div>

          {!compact && (
            <div data-gc="voz.voice-stage.div--7" {...flx("baseFaded", "absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-palco/80 to-transparent px-4 pb-3 pt-10")}>
              <div data-gc="voz.voice-stage.div--8" className="flex shrink-0 gap-2">
                {tiles.map((tile) => (
                  <WithMenu data-gc="voz.voice-stage.with-menu" key={tile.identity} tile={tile} context={context}>
                    <Tile data-gc="voz.voice-stage.tile" tile={tile} guildId={guildId} compact />
                  </WithMenu>
                ))}
              </div>
            </div>
          )}
        </div>

        {compact && (
          <div data-gc="voz.voice-stage.div--9" className="flex w-16 shrink-0 flex-col items-center gap-3 overflow-y-auto py-1">
            {tiles.map((tile) => (
              <WithMenu data-gc="voz.voice-stage.with-menu--2" key={tile.identity} tile={tile} context={context}>
                <ColumnFace data-gc="voz.voice-stage.column-face" tile={tile} />
              </WithMenu>
            ))}
          </div>
        )}

        <VoiceStageControls data-gc="voz.voice-stage.voice-stage-controls" fullTargetScreen={stage} showChat={compact} />
      </div>
    );
  }

  const grid = buildGrid(
    tiles.map((tile) => ({ identity: tile.identity, broadcasting: Boolean(tile.screenTrack), tile })),
  );

  const inFocus = focus(grid, focused);

  const showInvite = canInvite && grid.length <= 1 && !inFocus;
  const cells = grid.length + (showInvite ? 1 : 0);

  const { columns, dense } = formatGrid(cells);

  const draw = (
    frame: (typeof grid)[number],
    compact?: boolean,
    fill?: boolean,
    withoutCorner?: boolean,
    onClick?: () => void,
  ) =>
    frame.kind === "tela" ? (
      <TileDaLive data-gc="voz.voice-stage.tile-da-live"
        key={frame.key}
        tile={frame.de.tile}
        dense={dense || compact}
        className={fill ? "size-full" : undefined}
        onWatch={() => setWatching(frame.de.identity)}
      />
    ) : (
      <WithMenu data-gc="voz.voice-stage.with-menu--3" key={frame.key} tile={frame.de.tile} context={context}>
        <Tile data-gc="voz.voice-stage.tile--2"
          tile={frame.de.tile}
          guildId={guildId}
          dense={dense || compact}
          fill={fill}
          withoutCorner={withoutCorner}
          onFocus={onClick ?? (() => setFocused((current) => (current === frame.key ? null : frame.key)))}
        />
      </WithMenu>
    );

  if (inFocus) {
    return (
      <div data-gc="voz.voice-stage.div--10"
        ref={stage}
        className={cn(
          flxCls("voiceStage"),
          "group relative flex min-h-0 flex-1 flex-col gap-3 overflow-hidden bg-surface-2 pb-20",
          compact ? "p-4 pb-20" : "px-4 pt-14",
        )}
      >
        {!compact && (
          <CallCorners data-gc="voz.voice-stage.call-corners.on-toggle-chat"
            name={channelName}
            chatIsOpen={chatIsOpen}
            onToggleChat={onToggleChat}
            onInvite={canInvite ? () => setInviting(true) : undefined}
          />
        )}

        <div data-gc="voz.voice-stage.div--11" className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-surface-2">
          <div data-gc="voz.voice-stage.div--12" className="aspect-video w-full max-h-full [&>*]:size-full">
            {draw(inFocus.highlight, false, true)}
          </div>
        </div>

        <div data-gc="voz.voice-stage.div--13" className="relative flex shrink-0 flex-col items-center">
          <Tooltip data-gc="voz.voice-stage.tooltip--3" label={hiddenMembers ? "Mostrar membros" : "Ocultar membros"}>
            <button data-gc="voz.voice-stage.button--3"
              type="button"
              onClick={() => setMembersHidden((current) => !current)}
              aria-label={hiddenMembers ? "Mostrar membros" : "Ocultar membros"}
              aria-expanded={!hiddenMembers}
              className="absolute -top-4 z-10 flex items-center gap-1.5 rounded-full border border-line bg-surface-4/95 px-3 py-1.5 text-xs font-medium text-ink-muted opacity-0 shadow-lg backdrop-blur transition focus-visible:opacity-100 group-hover:opacity-100 hover:text-ink"
            >
              {hiddenMembers ? <CaretUp data-gc="voz.voice-stage.caret-up" size={13} weight="bold" /> : <CaretDown data-gc="voz.voice-stage.caret-down" size={13} weight="bold" />}
              <UsersThree data-gc="voz.voice-stage.users-three" size={15} weight="fill" />
              <span data-gc="voz.voice-stage.span--5" className="tabular-nums">{inFocus.track.length + 1}</span>
            </button>
          </Tooltip>

          {!hiddenMembers && (
            <div data-gc="voz.voice-stage.div--14" className="flex shrink-0 justify-center gap-2">
              {!inFocus.track.length && (
                <BackToCallCard data-gc="voz.voice-stage.back-to-call-card"
                  name={inFocus.highlight.de.tile.name}
                  onBack={() => setFocused(null)}
                />
              )}

              {inFocus.track.map((frame) => (
                <Tooltip data-gc="voz.voice-stage.tooltip--4" key={frame.key} label="Voltar para a chamada">
                  <div data-gc="voz.voice-stage.div--15" className="relative w-40 shrink-0">
                    {draw(frame, true, false, false, () => setFocused(null))}

                    <span data-gc="voz.voice-stage.span--6"
                      aria-hidden
                      className="pointer-events-none absolute inset-0 flex items-center justify-center"
                    >
                      <span data-gc="voz.voice-stage.span--7" className="flex size-9 items-center justify-center rounded-full bg-surface-4/80 text-ink shadow-lg backdrop-blur">
                        <PhoneCall data-gc="voz.voice-stage.phone-call" size={18} weight="fill" />
                      </span>
                    </span>
                  </div>
                </Tooltip>
              ))}
            </div>
          )}
        </div>

        <VoiceStageControls data-gc="voz.voice-stage.voice-stage-controls--2" fullTargetScreen={stage} showChat={compact} />

        <InviteModal data-gc="voz.voice-stage.invite-modal"
          open={inviting}
          guildId={guildId}
          guildName={guildName}
          onClose={() => setInviting(false)}
        />
      </div>
    );
  }

  if (compact) {
    return (
      <div data-gc="voz.voice-stage.div--16"
        ref={stage}
        {...flxAttr("callCompactStage")}
        className={cn(
          flxCls("callCompactStage"),
          "group relative flex min-h-0 flex-1 items-center justify-center gap-5 overflow-hidden bg-surface-2 p-4 pb-20",
        )}
      >
        {grid.map((frame) => (
          <div data-gc="voz.voice-stage.div--17" key={frame.key} className="h-full max-h-56 min-w-0 max-w-md flex-1">
            {draw(frame, false, true)}
          </div>
        ))}

        {!tiles.length && <p data-gc="voz.voice-stage.p--3" className="text-ink-muted">Ninguém em {channelName} ainda.</p>}

        <VoiceStageControls data-gc="voz.voice-stage.voice-stage-controls--3" fullTargetScreen={stage} showChat={compact} />
      </div>
    );
  }

  return (
    <div data-gc="voz.voice-stage.div--18"
      ref={stage}
      className={cn(
        flxCls("voiceStage"),
        "group relative flex min-h-0 flex-1 items-center justify-center overflow-hidden",
        "palco-de-um bg-surface-2 px-3 pb-20 pt-3.5",
      )}
    >
        <CallCorners data-gc="voz.voice-stage.call-corners.on-toggle-chat--2"
          name={channelName}
          chatIsOpen={chatIsOpen}
          onToggleChat={onToggleChat}
          onInvite={canInvite ? () => setInviting(true) : undefined}
        />

      <div data-gc="voz.voice-stage.div--19"
        className={cn(
          cells > 1 && "grade-de-varios",
          cells === 1 && "grid max-h-full quadro-de-um [&>*]:size-full",
        )}
        style={
          cells > 1
            ? 
              ({
                "--colunas": columns,
                "--linhas": Math.ceil(cells / columns),
                "--espaco": `${gridSpace(cells)}px`,
              } as React.CSSProperties)
            : { gridTemplateColumns: "repeat(1, minmax(0, 1fr))", gridAutoRows: "minmax(0, 1fr)" }
        }
      >
        {grid.map((frame) => draw(frame, false, cells === 1))}

        {showInvite && (
          <CallInviteCard data-gc="voz.voice-stage.call-invite-card"
            key="convite"
            channelName={channelName}
            onInvite={() => setInviting(true)}
          />
        )}
      </div>

      {!tiles.length && !showInvite && (
        <p data-gc="voz.voice-stage.p--4" className="text-ink-muted">Ninguém em {channelName} ainda.</p>
      )}

      <VoiceStageControls data-gc="voz.voice-stage.voice-stage-controls--4" fullTargetScreen={stage} showChat={compact} />

      <InviteModal data-gc="voz.voice-stage.invite-modal--2"
        open={inviting}
        guildId={guildId}
        guildName={guildName}
        onClose={() => setInviting(false)}
      />
    </div>
  );
};

interface TileProps {
  tile: VoiceTile;
  guildId?: string;
  compact?: boolean;
  dense?: boolean;
  fill?: boolean;
  withoutCorner?: boolean;
  onFocus?: () => void;
}

const Tile: React.FC<TileProps> = ({
  tile,
  guildId,
  compact,
  dense,
  fill,
  withoutCorner,
  onFocus,
}) => {
  const { t } = useTranslation();
  const resolve = useParticipant();
  const mirror = useVoicePrefs((s) => s.mirrorCamera);
  const playingSound = usePanelSound((s) => s.who === tile.identity);
  const speaking = tile.speaking || playingSound;
  const participant = resolve(tile.identity, {
    name: tile.name,
    avatarUrl: tile.avatarUrl,
  });

  return (
    <div data-gc="voz.voice-stage.div.on-focus"
      onClick={onFocus}
      {...flx(
        "participantFrame",
        cn(
          "group/tile relative flex items-center justify-center overflow-hidden bg-surface-1 transition",
          !withoutCorner && "rounded-xl",
          onFocus && "cursor-pointer",
          compact ? "h-16 w-24 shrink-0" : fill ? "size-full" : "aspect-video",
        ),
      )}
    >
      {tile.cameraTrack ? (
        <div data-gc="voz.voice-stage.div--20" className={cn("size-full", speaking && "ring-2 ring-online")}>
          <VoiceVideo data-gc="voz.voice-stage.voice-video--2" track={tile.cameraTrack} mirrored={tile.isLocal && mirror} />
        </div>
      ) : (
        <span data-gc="voz.voice-stage.span--8" className="relative flex items-center justify-center">
          {speaking && !compact && (
            <SpeechWaves data-gc="voz.voice-stage.speech-waves" size={dense ? 52 : 80} />
          )}

          <Avatar data-gc="voz.voice-stage.avatar"
            id={tile.identity}
            name={participant.name}
            url={participant.avatarUrl}
            size={compact ? 44 : dense ? 52 : 80}
            charms={participant.profile}
            animate={speaking}
            className={flxCls("avatarWithoutCamera")}
          />
        </span>
      )}

      <div data-gc="voz.voice-stage.div--21"
        {...flx(
          "participantSeals",
          cn(
            "absolute bottom-1.5 left-1.5 flex max-w-[calc(100%-0.75rem)] items-center gap-1 rounded bg-sobre-midia px-1.5 py-0.5",
            !compact && "bottom-2 left-2 gap-1.5 px-2 py-1",
          ),
        )}
      >
        {tile.micEnabled ? (
          <Mic data-gc="voz.voice-stage.mic" size={12} className="shrink-0 text-ink-muted" />
        ) : (
          <MicOff data-gc="voz.voice-stage.mic-off" size={12} className="shrink-0 text-danger" />
        )}

        <ConnectionNotice data-gc="voz.voice-stage.connection-notice" quality={tile.quality} />
        <UserProfilePopover data-gc="voz.voice-stage.user-profile-popover" userId={tile.identity} guildId={guildId} side="top">
          <button data-gc="voz.voice-stage.button--4"
            onClick={(e) => e.stopPropagation()}
            {...flx(
              "participantName",
              cn(
                "min-w-0 truncate whitespace-nowrap font-medium hover:underline",
                compact
                  ? "w-0 overflow-hidden text-10 opacity-0 transition-all group-hover/tile:w-auto group-hover/tile:opacity-100"
                  : "text-xs",
              ),
            )}
          >
            {participant.name}
            {tile.isLocal && " (você)"}
          </button>
        </UserProfilePopover>
      </div>
    </div>
  );
};

const TileDaLive: React.FC<{
  tile: VoiceTile;
  dense?: boolean;
  onWatch: () => void;
  className?: string;
}> = ({ tile, dense, onWatch, className }) => {
  const { t } = useTranslation();

  return (
  <div data-gc="voz.voice-stage.div--22"
    className={cn(
      "group/live relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-sobre-midia ring-1 ring-line-sutil",
      className,
    )}
  >
    {tile.isLocal && tile.screenTrack ? (
      <button data-gc="voz.voice-stage.button.on-watch" onClick={onWatch} className="absolute inset-0 size-full">
        <VoiceVideo data-gc="voz.voice-stage.voice-video--3" track={tile.screenTrack} />

        <span data-gc="voz.voice-stage.span--9" className="pointer-events-none absolute right-2 top-2 flex items-center gap-1.5 rounded-full bg-danger px-2 py-0.5 text-10 font-bold uppercase tracking-wide text-palco-ink">
          <span data-gc="voz.voice-stage.span--10" className="size-1.5 animate-pulse rounded-full bg-palco-ink" /> {t("chamada.live.etiqueta")}
        </span>
      </button>
    ) : (
      <button data-gc="voz.voice-stage.button.on-watch--2"
        onClick={onWatch}
        className="absolute inset-0 flex items-center justify-center transition hover:bg-palco-ink/5"
      >
        <span data-gc="voz.voice-stage.span--11" className="absolute right-2 top-2 flex items-center gap-1.5 rounded-full bg-danger px-2 py-0.5 text-10 font-bold uppercase tracking-wide text-palco-ink">
          <span data-gc="voz.voice-stage.span--12" className="size-1.5 animate-pulse rounded-full bg-palco-ink" /> {t("chamada.live.etiqueta")}
        </span>

        <span data-gc="voz.voice-stage.span--13"
          title={t("chamada.live.assistir")}
          className={cn(
            "flex items-center justify-center bg-brand font-medium text-palco-ink shadow-lg",
            "opacity-0 transition group-hover/live:opacity-100",
            dense
              ? "size-9 rounded-full"
              : "gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm",
          )}
        >
          <Play data-gc="voz.voice-stage.play" size={dense ? 16 : 16} />
          {!dense && t("chamada.live.assistir")}
        </span>
      </button>
    )}

    <div data-gc="voz.voice-stage.div--23" className="pointer-events-none absolute bottom-2 left-2 flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded bg-sobre-midia px-2 py-1">
      <Monitor data-gc="voz.voice-stage.monitor" size={12} className="shrink-0 text-online" />
      <span data-gc="voz.voice-stage.span--14" className="min-w-0 truncate whitespace-nowrap text-xs font-medium">
        {tile.name}
        {tile.isLocal && " (sua tela)"}
      </span>
    </div>

    {!tile.isLocal && <VolumeLiveControl data-gc="voz.voice-stage.volume-live-control" identity={tile.identity} className="absolute bottom-2 right-2" />}
  </div>
  );
};

const VolumeLiveControl: React.FC<{ identity: string; className?: string }> = ({
  identity,
  className,
}) => {
  const volume = useVoiceStore((s) => Math.min(1, s.screenVolumes[identity] ?? 1));
  const set = useVoiceStore((s) => s.setScreenVolume);

  return (
    <Popover data-gc="voz.voice-stage.popover">
      <Tooltip data-gc="voz.voice-stage.tooltip--5" label={volume === 0 ? "Live sem som" : `Volume da live · ${Math.round(volume * 100)}%`}>
        <PopoverTrigger data-gc="voz.voice-stage.popover-trigger" asChild>
          <button data-gc="voz.voice-stage.button--5"
            aria-label="Volume da live"
            className={cn(
              "pointer-events-auto rounded bg-sobre-midia p-1.5 text-palco-ink/80 transition hover:bg-sobre-midia hover:text-palco-ink",
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
          filled={volume}
          onChange={(e) => set(identity, Number(e.target.value))}
        />
      </PopoverContent>
    </Popover>
  );
};

const ConnectionNotice: React.FC<{ quality: string }> = ({ quality }) => {
  const notice = qualityNotice(quality);
  if (!notice) return null;

  return (
    <Tooltip data-gc="voz.voice-stage.tooltip--6" label={notice.label}>
      <span data-gc="voz.voice-stage.span--15" className={cn("flex shrink-0 items-center", notice.color)} aria-label={notice.label}>
        <SignalLow data-gc="voz.voice-stage.signal-low" size={12} className={notice.pulsing ? "animate-pulse" : undefined} />
      </span>
    </Tooltip>
  );
};

const ColumnFace: React.FC<{ tile: VoiceTile }> = ({ tile }) => {
  const mirror = useVoicePrefs((s) => s.mirrorCamera);
  const playingSound = usePanelSound((s) => s.who === tile.identity);
  const speaking = tile.speaking || playingSound;
  const resolve = useParticipant();
  const participant = resolve(tile.identity, { name: tile.name, avatarUrl: tile.avatarUrl });

  return (
    <div data-gc="voz.voice-stage.div--24" className="relative shrink-0" title={participant.name}>
      {tile.cameraTrack ? (
        <div data-gc="voz.voice-stage.div--25" className="size-11 overflow-hidden rounded-full">
          <VoiceVideo data-gc="voz.voice-stage.voice-video--4" track={tile.cameraTrack} mirrored={tile.isLocal && mirror} />
        </div>
      ) : (
        <Avatar data-gc="voz.voice-stage.avatar--2"
          id={tile.identity}
          name={participant.name}
          url={participant.avatarUrl}
          size={44}
          charms={participant.profile}
          animate={speaking}
        />
      )}

      {!tile.micEnabled && (
        <span data-gc="voz.voice-stage.span--16" className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-surface-0 ring-2 ring-surface-2">
          <MicOff data-gc="voz.voice-stage.mic-off--2" size={9} className="text-danger" />
        </span>
      )}
    </div>
  );
};

interface StageContext {
  guildId?: string;
  members: GuildMember[];
  roles: Role[];
  voiceChannels: Channel[];
  voiceStates: VoiceState[];
  minePermissions: Permission[];
  currentUserId?: string;
}

const WithMenu: React.FC<{
  tile: VoiceTile;
  context: StageContext;
  children: React.ReactNode;
}> = ({ tile, context, children }) => {
  if (!context.guildId) return <>{children}</>;

  return (
    <VoiceMemberMenu data-gc="voz.voice-stage.voice-member-menu"
      guildId={context.guildId}
      userId={tile.identity}
      displayName={
        context.members.find((m) => m.user.id === tile.identity)?.user.displayName ?? tile.name
      }
      voiceState={context.voiceStates.find((v) => v.userId === tile.identity)}
      member={context.members.find((m) => m.user.id === tile.identity)}
      roles={context.roles}
      voiceChannels={context.voiceChannels}
      minePermissions={context.minePermissions}
      currentUserId={context.currentUserId}
    >
      <div data-gc="voz.voice-stage.div--26">{children}</div>
    </VoiceMemberMenu>
  );
};
