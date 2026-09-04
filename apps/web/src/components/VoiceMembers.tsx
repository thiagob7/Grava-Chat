import React, { useState } from "react";
import { Play } from "lucide-react";
/*
  Mesma família e mesmo peso da lista de canais logo acima: eram ícones lucide
  de contorno a 13px pendurados numa lista de Phosphor `fill` a 20px.
*/
import {
  CellSignalLow,
  MicrophoneSlash,
  MonitorArrowUp,
  SpeakerSlash,
  VideoCamera,
} from "@phosphor-icons/react";
import type { Channel, GuildMember, Permission, Role, VoiceState } from "@gravae/shared";
import { has } from "@gravae/shared";

import { Avatar } from "~/components/Avatar";
import { UserProfilePopover } from "~/components/UserProfilePopover";
import { VoiceMemberMenu } from "~/components/VoiceMemberMenu";
import { useVoiceStore } from "~/stores/voice-store";
import { Popover, PopoverAnchor, PopoverContent } from "~/components/ui/popover";
import { avisoDeQualidade } from "~/lib/qualidade-da-conexao";
import { useSomDoPainel } from "~/lib/soundboard";
import { Tooltip } from "~/components/ui/tooltip";
import { VoiceVideo } from "~/components/VoiceTrack";
import type { Track } from "livekit-client";
import { cn } from "~/lib/utils";
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
  /// Quem apertou um som também "fala": o áudio sai na chamada, e o rosto
  /// parado enquanto todo mundo ouve deixava sem saber de quem tinha vindo.
  const somDe = useSomDoPainel((s) => s.quem);
  const falando = new Set(tiles.filter((t) => t.speaking).map((t) => t.identity));

  /*
    Só oferecemos "Assistir" para quem já está na MESMA chamada.

    Fora dela não há sala do LiveKit conectada, e o alvo seria descartado no
    próximo `refresh()` — o botão pareceria quebrado. Entrar na chamada antes é
    um fluxo à parte, e já existe: é o clique no canal.
  */
  const canalConectado = useVoiceStore((s) => s.channelId);
  const assistir = useVoiceStore((s) => s.assistir);
  const assistindo = useVoiceStore((s) => s.assistindo);

  const podeModerar = has(new Set(minhasPermissoes), "MODERATE_MEMBERS");

  if (!states.length) return null;

  return (
    <div className="mb-1 ml-6 space-y-0.5">
      {states.map((state) => {
        const member = members.find((m) => m.user.id === state.userId);
        const name = member?.nickname ?? member?.user.displayName ?? "…";

        /*
          Não oferecemos o que você já está fazendo: se a live desta pessoa já
          está aberta na sua tela, o convite pra assistir é ruído.
        */
        const podeAssistir =
          state.screenShare && canalConectado === state.channelId && assistindo !== state.userId;

        const naSala = tiles.find((t) => t.identity === state.userId);
        const transmissao = naSala?.screenTrack ?? null;
        /// só quem está na MESMA sala tem medida; dos outros não sabemos nada
        const conexao = naSala ? avisoDeQualidade(naSala.qualidade) : null;

        const linha = (
          <ConviteParaLive
            ativo={podeAssistir}
            nome={name}
            transmissao={transmissao}
            onAssistir={() => assistir(state.userId)}
          >
            <UserProfilePopover
              userId={state.userId}
              guildId={guildId}
              roles={roles}
              roleIds={member?.roleIds ?? []}
              podeModerar={podeModerar}
            >
              <button className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left transition hover:bg-hover">
                <Avatar
                  id={state.userId}
                  name={name}
                  url={member?.user.avatarUrl}
                  size={24}
                  speaking={falando.has(state.userId) || somDe === state.userId}
                />
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-sm font-medium leading-5",
                  state.selfMute ? "text-ink-faint" : "text-ink-muted",
                )}
              >
                {name}
              </span>
                <span className="flex shrink-0 items-center gap-1 text-ink-faint">
                {conexao && (
                  <Tooltip label={conexao.rotulo}>
                    <span className={cn("flex items-center", conexao.cor)} aria-label={conexao.rotulo}>
                      <CellSignalLow
                        size={14}
                        weight="fill"
                        className={conexao.pulsando ? "animate-pulse" : undefined}
                      />
                    </span>
                  </Tooltip>
                )}
                {state.screenShare && (
                  <MonitorArrowUp size={14} weight="fill" className="text-online" />
                )}
                {state.camera && <VideoCamera size={14} weight="fill" className="text-online" />}

                {/*
                  Só o que está DESLIGADO aparece.

                  Antes, quem estava com o microfone aberto — o caso normal —
                  ganhava um ícone de microfone do mesmo jeito. Numa chamada de
                  oito pessoas isso são oito ícones dizendo "está tudo certo",
                  e o único que importa, o de quem está mudo, se perde no meio
                  deles. É o que a referência faz: silêncio quando não há nada
                  a avisar.
                */}
                {(state.serverMute || state.selfMute) && (
                  <MicrophoneSlash size={14} weight="fill" className="text-danger" />
                )}
                {(state.serverDeaf || state.selfDeaf) && (
                  <SpeakerSlash size={14} weight="fill" className="text-danger" />
                )}
                </span>
              </button>
            </UserProfilePopover>
          </ConviteParaLive>
        );

        if (!guildId) return <div key={state.userId}>{linha}</div>;

        return (
          <VoiceMemberMenu
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
            <div>{linha}</div>
          </VoiceMemberMenu>
        );
      })}
    </div>
  );
};

/**
 * O convite para assistir, num balão ao LADO da linha.
 *
 * A primeira versão era um botão dentro da própria linha, e não cabia: a linha
 * tem 24px de avatar, o nome, e ainda os ícones de microfone, câmera e monitor
 * — o botão empurrava tudo e cobria os ícones ao aparecer. Num balão ao lado
 * não disputa espaço com nada, e ainda sobra lugar pra dizer de quem é a live.
 *
 * Abre no mouse e não no clique porque o clique na linha já tem dono: ele abre
 * o cartão de perfil. Por isso o balão é ancorado (`PopoverAnchor`) em vez de
 * disparado por um gatilho — o gatilho seria um segundo botão dentro de um
 * botão, que é HTML inválido.
 */
const ConviteParaLive: React.FC<{
  ativo: boolean;
  nome: string;
  /// a faixa de vídeo da transmissão, pra prévia
  transmissao: Track | null;
  onAssistir: () => void;
  children: React.ReactNode;
}> = ({ ativo, nome, transmissao, onAssistir, children }) => {
  const { t } = useTranslation();
  const [aberto, setAberto] = useState(false);

  if (!ativo) return <div>{children}</div>;

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverAnchor asChild>
        <div onMouseEnter={() => setAberto(true)} onMouseLeave={() => setAberto(false)}>
          {children}
        </div>
      </PopoverAnchor>

      <PopoverContent
        side="right"
        align="center"
        className="w-64 space-y-2 p-2"
        /// sem isto o balão fecharia ao mover o mouse da linha até ele
        onMouseEnter={() => setAberto(true)}
        onMouseLeave={() => setAberto(false)}
        /// o foco pertence à linha; roubá-lo faria a lista pular ao passar o mouse
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/*
          A prévia assina o vídeo — e por isso ela vive AQUI, e não nos quadros
          da grade. Aqui é uma transmissão por vez, só enquanto o mouse está em
          cima; na grade seriam todas ao mesmo tempo, o tempo todo, e a tela é
          publicada em camada única (1080p por miniatura) no Micro de 1/8 de
          núcleo. É a diferença entre pagar por uma e pagar por todas.
        */}
        <div className="aspect-video overflow-hidden rounded bg-black">
          {transmissao ? (
            <VoiceVideo track={transmissao} />
          ) : (
            <div className="flex size-full items-center justify-center text-xs text-ink-faint">
              {t("chamada.carregandoPrevia")}
            </div>
          )}
        </div>

        <button
          onClick={() => {
            onAssistir();
            setAberto(false);
          }}
          className="flex w-full items-center justify-center gap-2 rounded bg-surface-3 px-2 py-1.5 text-sm font-medium transition hover:bg-surface-4"
        >
          <Play size={14} className="text-online" />
          {t("chamada.live.assistirPessoa", { nome })}
        </button>
      </PopoverContent>
    </Popover>
  );
};
