import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { AudioLines, MonitorUp, MonitorX, PhoneOff, Signal, Video, VideoOff } from "lucide-react";
import { useFindGuild } from "~/@core/application/queries/guild/use-find-guild";
import { usePermissions } from "~/hooks/use-permissions";
import { SoundboardPanel } from "~/features/voz/components/SoundboardPanel";
import { useAuthConfig } from "~/@core/application/queries/auth/use-auth-config";
import { useFindDms } from "~/@core/application/queries/friend/use-find-dms";
import { SupressaoDeRuidoPopover } from "~/features/voz/components/SupressaoDeRuidoPopover";
import { VoiceDetailsPopover } from "~/features/voz/components/VoiceDetailsPopover";
import { corDoPing, useVoicePing, type PingDaChamada } from "~/features/voz/hooks/use-voice-ping";
import { desktop } from "~/lib/desktop";
import { Tooltip } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";
import { useConfiguracoes } from "~/features/configuracoes/stores/configuracoes";
import { useVoicePrefs } from "~/features/voz/stores/voice-prefs";
import { useVoiceStore } from "~/features/voz/stores/voice-store";

const SECAO_DA_CHAMADA = "mb-2";

interface VoicePanelProps {
  accountChannelId?: string | null;
}

export const VoicePanel: React.FC<VoicePanelProps> = ({ accountChannelId }) => {
  const { t } = useTranslation();
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
      <p className={cn(SECAO_DA_CHAMADA, "flex items-center gap-1.5 truncate py-2 text-xs text-ink-muted")}>
        <Signal size={13} className="shrink-0 text-idle" />
        Em voz noutra aba
        {remote ? ` · ${remote.name}` : ""}
      </p>
    );
  }

  if (!channelId) return null;

  const channel = channels.find((c) => c.id === channelId);

  return (
    <div className={SECAO_DA_CHAMADA}>
      <div className="mb-2 flex items-center justify-between">
        <div className="min-w-0">
          <VoiceDetailsPopover ping={ping} regiao={regiaoDaChamada(config?.voiceUrl)}>
            <button
              aria-label={t("chamada.detalhes.abrir")}
              className="group/voz flex w-full items-center gap-1.5 text-left text-sm font-semibold"
            >
              <IconeDeSinal ping={ping} />

              <span className="grid min-w-0 grid-cols-1 overflow-hidden">
                <span className="col-start-1 row-start-1 truncate text-online transition duration-200 ease-out group-hover/voz:-translate-y-full group-hover/voz:opacity-0">
                  {conversa ? "Em uma chamada" : "Voz conectada"}
                </span>
                <span className="col-start-1 row-start-1 translate-y-full truncate text-ink opacity-0 transition duration-200 ease-out group-hover/voz:translate-y-0 group-hover/voz:opacity-100">
                  {t("chamada.detalhes.titulo")}
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
            title={t("chamada.voltar")}
            className="block max-w-full truncate text-left text-xs text-ink-muted transition hover:text-ink hover:underline disabled:cursor-default disabled:no-underline"
          >
            {conversa
              ? conversa.user.displayName
              : `${channel?.name ?? "…"} ${guildName ? `/ ${guildName}` : ""}`}
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <SupressaoDeRuidoPopover
            ligada={noiseFilter}
            disponivel={noiseFilterAvailable}
            ocupada={noiseFilterBusy}
            onAlternar={() => void toggleNoiseFilter()}
            onAbrirAjustes={() => abrirConfiguracoes("voz")}
          >
            <button
              aria-label={t("chamada.ruido.titulo")}
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

          <Tooltip label={t("chamada.desconectar")}>
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

        <VoiceControl label={t("chamada.aparelhos.camera")} onClick={() => void toggleCamera()}>
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
      className="flex items-center justify-center rounded-lg bg-hover py-2 text-ink-muted transition hover:bg-surface-4 hover:text-ink"
    >
      {children}
    </button>
  </Tooltip>
);

const AvisoMicrofoneBloqueado: React.FC = () => {
  const { t } = useTranslation();
  const ponte = desktop();
  const [statusDoSistema, setStatusDoSistema] = useState<string | null>(null);

  useEffect(() => {
    if (!ponte) return;
    void ponte.midia.status("microphone").then(setStatusDoSistema);
  }, [ponte]);

  if (!ponte) {
    return (
      <p className="mb-2 rounded bg-danger/15 px-2 py-1.5 text-xs text-danger">
        {t("chamada.microfone.bloqueado")}
      </p>
    );
  }

  if (statusDoSistema && statusDoSistema !== "granted") {
    return (
      <div className="mb-2 rounded bg-danger/15 px-2 py-1.5 text-xs text-danger">
        <p>
          {t("chamada.microfone.bloqueadoNoMac")} <b>{ponte.nomeNoSistema}</b> em{" "}
          <b>{t("chamada.microfone.caminhoNoMac")}</b>.
        </p>
        <button
          onClick={() => ponte.midia.abrirAjustes("microphone")}
          className="mt-1.5 rounded bg-danger/25 px-2 py-1 font-medium transition hover:bg-danger/40"
        >
          {t("chamada.microfone.abrirAjustes")}
        </button>
        <p className="mt-1.5 text-ink-faint">{t("chamada.microfone.vaiReabrir")}</p>
      </div>
    );
  }

  return (
    <p className="mb-2 rounded bg-danger/15 px-2 py-1.5 text-xs text-danger">
      {t("chamada.microfone.naoAbriu")}
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
