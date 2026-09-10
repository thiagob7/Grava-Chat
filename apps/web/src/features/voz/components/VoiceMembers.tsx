import React, { useState } from "react";
import {
  CellSignalLow,
  MicrophoneSlash,
  MonitorArrowUp,
  SpeakerSlash,
  VideoCamera,
} from "@phosphor-icons/react";
import type { Channel, GuildMember, Permission, Role, VoiceState } from "@gravae/shared";
import { has } from "@gravae/shared";

import { Avatar } from "~/features/perfil/components/Avatar";
import { UserProfilePopover } from "~/features/perfil/components/UserProfilePopover";
import { VoiceMemberMenu } from "~/features/voz/components/VoiceMemberMenu";
import { useVoiceStore } from "~/features/voz/stores/voice-store";
import { Popover, PopoverAnchor, PopoverContent } from "~/components/ui/popover";
import { avisoDeQualidade } from "~/features/voz/lib/qualidade-da-conexao";
import { useSomDoPainel } from "~/features/voz/lib/soundboard";
import { Tooltip } from "~/components/ui/tooltip";
import { PreviaDaTransmissao } from "~/features/voz/components/PreviaDaTransmissao";
import type { Track } from "livekit-client";
import { cn } from "~/lib/utils";
import { flxCls } from "~/lib/compat-de-tema";
import { useTranslation } from "~/traducao";

interface VoiceMembersProps {
  states: VoiceState[];
  members: GuildMember[];
  guildId?: string;
  roles?: Role[];
  canaisDeVoz?: Channel[];
  minhasPermissoes?: Permission[];
  currentUserId?: string;
}

export const VoiceMembers: React.FC<VoiceMembersProps> = ({
  states,
  members,
  guildId,
  roles = [],
  canaisDeVoz = [],
  minhasPermissoes = [],
  currentUserId,
}) => {
  const { t } = useTranslation();
  const tiles = useVoiceStore((s) => s.tiles);
  const somDe = useSomDoPainel((s) => s.quem);
  const falando = new Set(tiles.filter((t) => t.speaking).map((t) => t.identity));

  const canalConectado = useVoiceStore((s) => s.channelId);
  const assistir = useVoiceStore((s) => s.assistir);
  const assistindo = useVoiceStore((s) => s.assistindo);

  const podeModerar = has(new Set(minhasPermissoes), "MODERATE_MEMBERS");

  if (!states.length) return null;

  return (
    <div data-gc="voz.voice-members.div" className="mb-1 ml-6 space-y-0.5">
      {states.map((state) => {
        const member = members.find((m) => m.user.id === state.userId);
        const name = member?.nickname ?? member?.user.displayName ?? "…";

        const podeAssistir =
          state.screenShare && canalConectado === state.channelId && assistindo !== state.userId;

        const naSala = tiles.find((t) => t.identity === state.userId);
        const transmissao = naSala?.screenTrack ?? null;
        const conexao = naSala ? avisoDeQualidade(naSala.qualidade) : null;

        const linha = (
          <ConviteParaLive data-gc="voz.voice-members.convite-para-live"
            ativo={podeAssistir}
            nome={name}
            transmissao={transmissao}
            onAssistir={() => assistir(state.userId)}
          >
            <UserProfilePopover data-gc="voz.voice-members.user-profile-popover"
              userId={state.userId}
              guildId={guildId}
              roles={roles}
              roleIds={member?.roleIds ?? []}
              podeModerar={podeModerar}
            >
              <button data-gc="voz.voice-members.button"
                data-gc-usuario={state.userId}
                className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left transition hover:bg-hover"
              >
                <Avatar data-gc="voz.voice-members.avatar"
                  id={state.userId}
                  name={name}
                  url={member?.user.avatarUrl}
                  size={24}
                  speaking={falando.has(state.userId) || somDe === state.userId}
                />
              <span data-gc="voz.voice-members.span"
                className={cn(
                  "min-w-0 flex-1 truncate text-sm font-medium leading-5",
                  state.selfMute ? "text-ink-faint" : "text-ink-muted",
                )}
              >
                {name}
              </span>
                <span data-gc="voz.voice-members.span--2" className="flex shrink-0 items-center gap-1 text-ink-faint">
                {conexao && (
                  <Tooltip data-gc="voz.voice-members.tooltip" label={conexao.rotulo}>
                    <span data-gc="voz.voice-members.span--3" className={cn("flex items-center", conexao.cor)} aria-label={conexao.rotulo}>
                      <CellSignalLow data-gc="voz.voice-members.cell-signal-low"
                        size={14}
                        weight="fill"
                        className={conexao.pulsando ? "animate-pulse" : undefined}
                      />
                    </span>
                  </Tooltip>
                )}
                {state.screenShare && (
                  <Tooltip data-gc="voz.voice-members.tooltip--2" label={t("chamada.aoVivo")}>
                    <span data-gc="voz.voice-members.span--4"
                      className={cn(flxCls("seloDeAoVivo"), "flex items-center text-online")}
                      aria-label={t("chamada.aoVivo")}
                    >
                      <MonitorArrowUp data-gc="voz.voice-members.monitor-arrow-up" size={14} weight="fill" />
                    </span>
                  </Tooltip>
                )}
                {state.camera && <VideoCamera data-gc="voz.voice-members.video-camera" size={14} weight="fill" className="text-online" />}

                {(state.serverMute || state.selfMute) && (
                  <MicrophoneSlash data-gc="voz.voice-members.microphone-slash" size={14} weight="fill" className="text-danger" />
                )}
                {(state.serverDeaf || state.selfDeaf) && (
                  <SpeakerSlash data-gc="voz.voice-members.speaker-slash" size={14} weight="fill" className="text-danger" />
                )}
                </span>
              </button>
            </UserProfilePopover>
          </ConviteParaLive>
        );

        if (!guildId) return <div data-gc="voz.voice-members.div--2" key={state.userId}>{linha}</div>;

        return (
          <VoiceMemberMenu data-gc="voz.voice-members.voice-member-menu"
            key={state.userId}
            guildId={guildId}
            userId={state.userId}
            displayName={name}
            voiceState={state}
            member={member}
            roles={roles}
            canaisDeVoz={canaisDeVoz}
            minhasPermissoes={minhasPermissoes}
            currentUserId={currentUserId}
          >
            <div data-gc="voz.voice-members.div--3">{linha}</div>
          </VoiceMemberMenu>
        );
      })}
    </div>
  );
};

const ConviteParaLive: React.FC<{
  ativo: boolean;
  nome: string;
  transmissao: Track | null;
  onAssistir: () => void;
  children: React.ReactNode;
}> = ({ ativo, nome, transmissao, onAssistir, children }) => {
  const { t } = useTranslation();
  const [aberto, setAberto] = useState(false);

  if (!ativo) return <div data-gc="voz.voice-members.div--4">{children}</div>;

  return (
    <Popover data-gc="voz.voice-members.popover.set-aberto" open={aberto} onOpenChange={setAberto}>
      <PopoverAnchor data-gc="voz.voice-members.popover-anchor" asChild>
        <div data-gc="voz.voice-members.div--5" onMouseEnter={() => setAberto(true)} onMouseLeave={() => setAberto(false)}>
          {children}
        </div>
      </PopoverAnchor>

      <PopoverContent data-gc="voz.voice-members.popover-content"
        side="right"
        align="center"
        className="w-64 space-y-2 p-2"
        onMouseEnter={() => setAberto(true)}
        onMouseLeave={() => setAberto(false)}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div data-gc="voz.voice-members.div--6" className="relative aspect-video overflow-hidden rounded bg-palco ring-1 ring-line-sutil">
          <div data-gc="voz.voice-members.div--7" className="flex size-full items-center justify-center text-11 text-ink-faint">
            {t("chamada.carregandoPrevia")}
          </div>

          {transmissao && <PreviaDaTransmissao data-gc="voz.voice-members.previa-da-transmissao" track={transmissao} />}

          <span data-gc="voz.voice-members.span--5" className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-sm bg-danger px-1.5 py-0.5 text-10 font-bold uppercase tracking-wide text-sobre-marca">
            <span data-gc="voz.voice-members.span--6" className="size-1.5 animate-pulse rounded-full bg-sobre-marca" />
            {t("chamada.live.etiquetaMaiuscula")}
          </span>
        </div>

        <button data-gc="voz.voice-members.button--2"
          onClick={() => {
            onAssistir();
            setAberto(false);
          }}
          className="flex w-full items-center justify-center gap-2 rounded border border-line bg-surface-3 px-2 py-2 text-sm font-medium text-ink transition hover:bg-surface-4"
        >
          <MonitorArrowUp data-gc="voz.voice-members.monitor-arrow-up--2" size={15} weight="fill" className="text-online" />
          {t("chamada.live.assistirPessoa", { nome })}
        </button>
      </PopoverContent>
    </Popover>
  );
};
