import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { AudioLines, MonitorUp, MonitorX, PhoneOff, Signal, Video, VideoOff } from "lucide-react";
import { useFindGuild } from "~/@core/application/queries/guild/use-find-guild";
import { usePermissions } from "~/hooks/use-permissions";
import { SoundboardPanel } from "~/components/SoundboardPanel";
import { useAuthConfig } from "~/@core/application/queries/auth/use-auth-config";
import { useFindDms } from "~/@core/application/queries/friend/use-find-dms";
import { SupressaoDeRuidoPopover } from "~/components/SupressaoDeRuidoPopover";
import { VoiceDetailsPopover } from "~/components/VoiceDetailsPopover";
import { corDoPing, useVoicePing, type PingDaChamada } from "~/hooks/use-voice-ping";
import { desktop } from "~/lib/desktop";
import { Tooltip } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import { useConfiguracoes } from "~/stores/configuracoes";
import { useVoicePrefs } from "~/stores/voice-prefs";
import { useVoiceStore } from "~/stores/voice-store";

/** A secao da chamada nao tem fundo proprio: o cartao e o `RodapeDaBarra`. */
const SECAO_DA_CHAMADA = "mb-2";

interface VoicePanelProps {
  accountChannelId?: string | null;
  onMoveHere?: (channelId: string) => void;
}

export const VoicePanel: React.FC<VoicePanelProps> = ({ accountChannelId, onMoveHere }) => {
  const navigate = useNavigate();
  const {
    channelId,
    guildId,
    micBlocked,
    cameraEnabled,
    screenEnabled,
    noiseFilterAvailable,
    noiseFilterBusy,
    toggleNoiseFilter,
    toggleCamera,
    toggleScreen,
    leave,
  } = useVoiceStore();

  const { data: detail } = useFindGuild(guildId ?? undefined);

  /*
    Numa chamada de privado não há servidor nem canal a consultar: o `guildId`
    é nulo e a busca acima volta vazia. Sem isto, o painel anunciava a chamada
    como "…" — dizia que você estava em voz e não dizia com quem.
  */
  const { data: dms = [] } = useFindDms(true);
  const conversa = dms.find((dm) => dm.id === channelId);
  const channels = detail?.channels ?? [];
  const guildName = detail?.guild.name;
  const podeUsarSons = usePermissions(detail).can("USE_SOUNDBOARD");

  const ping = useVoicePing();
  const { data: config } = useAuthConfig();

  const noiseFilter = useVoicePrefs((s) => s.supressaoDeRuido);
  const abrirConfiguracoes = useConfiguracoes((s) => s.abrir);

  if (!channelId && accountChannelId) {
    const remote = channels.find((c) => c.id === accountChannelId);

    return (
      <div className={cn(SECAO_DA_CHAMADA, "px-1 pt-1")}>
        <p className="flex items-center gap-1.5 text-sm font-medium text-idle">
          <Signal size={16} /> Em chamada em outra aba
        </p>
        <p className="mt-0.5 truncate text-xs text-ink-muted">
          {remote?.name ?? "…"} {guildName ? `/ ${guildName}` : ""}
        </p>
        <button
          onClick={() => onMoveHere?.(accountChannelId)}
          className="mt-1.5 text-xs font-medium text-brand hover:underline"
        >
          Trazer a chamada para esta aba
        </button>
      </div>
    );
  }

  if (!channelId) return null;

  const channel = channels.find((c) => c.id === channelId);

  return (
    <div className={SECAO_DA_CHAMADA}>
      <div className="mb-2 flex items-center justify-between">
        <div className="min-w-0">
          <VoiceDetailsPopover ping={ping} regiao={regiaoDaChamada(config?.voiceUrl)}>
            {/*
              O grupo é o próprio botão: antes ele era a seção inteira, então
              chegar perto do botão de desligar já trocava o rótulo para
              "Detalhes de Voz" sem que o mouse tivesse encostado no texto.
            */}
            <button
              aria-label="Detalhes de voz"
              className="group/voz flex w-full items-center gap-1.5 text-left text-sm font-semibold"
            >
              {/*
                O ícone fica de fora da troca: ele é o mesmo nos dois rótulos, e
                vê-lo deslizar junto só denunciava que são dois textos
                empilhados. Quem rola é o texto, dentro de uma janelinha da
                altura da linha — um sai por cima enquanto o outro sobe no
                lugar, como no Discord.
              */}
              <IconeDeSinal ping={ping} />

              <span className="grid min-w-0 grid-cols-1 overflow-hidden">
                <span className="col-start-1 row-start-1 truncate text-online transition duration-200 ease-out group-hover/voz:-translate-y-full group-hover/voz:opacity-0">
                  {conversa ? "Em uma chamada" : "Voz conectada"}
                </span>
                <span className="col-start-1 row-start-1 translate-y-full truncate text-ink opacity-0 transition duration-200 ease-out group-hover/voz:translate-y-0 group-hover/voz:opacity-100">
                  Detalhes de Voz
                </span>
              </span>
            </button>
          </VoiceDetailsPopover>
          <button
            onClick={() =>
              conversa
                ? navigate(`/dm/${conversa.id}`)
                : guildId && navigate(`/channels/${guildId}/${channelId}`)
            }
            disabled={!guildId && !conversa}
            title="Voltar para a chamada"
            className="block max-w-full truncate text-left text-xs text-ink-muted transition hover:text-ink hover:underline disabled:cursor-default disabled:no-underline"
          >
            {conversa
              ? conversa.user.displayName
              : `${channel?.name ?? "…"} ${guildName ? `/ ${guildName}` : ""}`}
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {/*
            O clique ABRE, e não liga. Ligar direto era uma decisão às cegas: a
            pessoa não sabe o que a supressão faz sem experimentar no meio de
            uma conversa, e não tinha como conferir o resultado sem perguntar
            "tá me ouvindo bem?" pra alguém. O interruptor continua ali dentro,
            a um clique de distância, agora com um medidor ao lado.
          */}
          <SupressaoDeRuidoPopover
            ligada={noiseFilter}
            disponivel={noiseFilterAvailable}
            ocupada={noiseFilterBusy}
            onAlternar={() => void toggleNoiseFilter()}
            onAbrirAjustes={() => abrirConfiguracoes("voz")}
          >
            <button
              aria-label="Supressão de ruído"
              aria-pressed={noiseFilter && noiseFilterAvailable}
              className={cn(
                "rounded p-2 transition hover:bg-surface-3",
                noiseFilterBusy && "animate-pulse",
                noiseFilter && noiseFilterAvailable ? "text-online" : "text-ink-muted hover:text-ink",
              )}
            >
              <AudioLines size={18} />
            </button>
          </SupressaoDeRuidoPopover>

          <Tooltip label="Desconectar">
            <button
              onClick={() => void leave()}
              className="rounded p-2 text-ink-muted transition hover:bg-surface-3 hover:text-danger"
            >
              <PhoneOff size={18} />
            </button>
          </Tooltip>
        </div>
      </div>

      {micBlocked && <AvisoMicrofoneBloqueado />}

      <div className="grid grid-cols-3 gap-1">
        <SoundboardPanel guildId={guildId ?? undefined} podeUsar={podeUsarSons} />

        <VoiceControl label="Câmera" onClick={() => void toggleCamera()}>
          {cameraEnabled ? <Video size={18} className="text-online" /> : <VideoOff size={18} />}
        </VoiceControl>

        <VoiceControl
          label={screenEnabled ? "Parar de compartilhar" : "Compartilhar tela"}
          onClick={() => void toggleScreen()}
        >
          {screenEnabled ? (
            <MonitorX size={18} className="text-online" />
          ) : (
            <MonitorUp size={18} />
          )}
        </VoiceControl>
      </div>
    </div>
  );
};

interface VoiceControlProps {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}

const VoiceControl: React.FC<VoiceControlProps> = ({ children, label, onClick }) => (
  <Tooltip label={label}>
    <button
      onClick={onClick}
      aria-label={label}
      className="flex items-center justify-center rounded bg-surface-3 py-2 text-ink-muted transition hover:bg-surface-4 hover:text-ink"
    >
      {children}
    </button>
  </Tooltip>
);

const AvisoMicrofoneBloqueado: React.FC = () => {
  const ponte = desktop();
  const [statusDoSistema, setStatusDoSistema] = useState<string | null>(null);

  useEffect(() => {
    if (!ponte) return;
    void ponte.midia.status("microphone").then(setStatusDoSistema);
  }, [ponte]);

  if (!ponte) {
    return (
      <p className="mb-2 rounded bg-danger/15 px-2 py-1.5 text-xs text-danger">
        Microfone bloqueado — você está só ouvindo. Libere o acesso nas permissões do navegador.
      </p>
    );
  }

  if (statusDoSistema && statusDoSistema !== "granted") {
    return (
      <div className="mb-2 rounded bg-danger/15 px-2 py-1.5 text-xs text-danger">
        <p>
          O macOS está bloqueando o microfone. Marque o <b>{ponte.nomeNoSistema}</b> em{" "}
          <b>Ajustes do Sistema → Privacidade e Segurança → Microfone</b>.
        </p>
        <button
          onClick={() => ponte.midia.abrirAjustes("microphone")}
          className="mt-1.5 rounded bg-danger/25 px-2 py-1 font-medium transition hover:bg-danger/40"
        >
          Abrir os ajustes
        </button>
        <p className="mt-1.5 text-ink-faint">O macOS vai pedir pra reabrir o aplicativo.</p>
      </div>
    );
  }

  return (
    <p className="mb-2 rounded bg-danger/15 px-2 py-1.5 text-xs text-danger">
      Não deu pra abrir o microfone — você está só ouvindo. Confira o dispositivo em Configurações
      → Voz e vídeo.
    </p>
  );
};

const IconeDeSinal: React.FC<{ ping: PingDaChamada }> = ({ ping }) => (
  <Tooltip label={ping.ms !== null ? `${ping.ms} ms` : "Medindo…"}>
    <span className={corDoPing(ping)}>
      <Signal size={16} />
    </span>
  </Tooltip>
);

function regiaoDaChamada(url: string | undefined): string {
  if (!url) return "Servidor de voz";

  try {
    return new URL(url).hostname;
  } catch {
    return "Servidor de voz";
  }
}
