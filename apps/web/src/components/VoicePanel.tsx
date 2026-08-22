import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { AudioLines, MonitorUp, PhoneOff, Signal, Video, VideoOff } from "lucide-react";
import { useFindGuild } from "~/@core/application/queries/guild/use-find-guild";
import { usePermissions } from "~/hooks/use-permissions";
import { SoundboardPanel } from "~/components/SoundboardPanel";
import { useAuthConfig } from "~/@core/application/queries/auth/use-auth-config";
import { VoiceDetailsPopover } from "~/components/VoiceDetailsPopover";
import { corDoPing, useVoicePing, type PingDaChamada } from "~/hooks/use-voice-ping";
import { desktop } from "~/lib/desktop";
import { Tooltip } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import { useVoicePrefs } from "~/stores/voice-prefs";
import { useVoiceStore } from "~/stores/voice-store";

interface VoicePanelProps {
  /**
   * Canal em que a CONTA está (vem do servidor). Pode ser diferente do canal em
   * que ESTA aba está conectada — a mesma conta pode ter várias abas abertas,
   * mas só uma segura a sessão de mídia.
   *
   * Só a tela do servidor sabe disso, então continua vindo de fora.
   */
  accountChannelId?: string | null;
  onMoveHere?: (channelId: string) => void;
}

/**
 * O painel de "Voz conectada" acima do seu usuário.
 *
 * Ele NÃO depende de onde você está navegando: os dados vêm da chamada, não da
 * tela. Antes recebia os canais e o nome do servidor abertos, e por isso
 * mostrava "… / OutroServidor" assim que você trocava de servidor — o nome era
 * o do lugar em que você estava olhando, não o da chamada. E na tela de
 * conversas ele nem existia, que é justamente onde some o resto da referência.
 */
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

  /**
   * O servidor DA CHAMADA, não o que está aberto. Sai do cache (você esteve
   * nele pra entrar na chamada); se por acaso não estiver, a consulta busca —
   * e é o comportamento certo, porque sem ela não há como nomear o canal.
   */
  const { data: detail } = useFindGuild(guildId ?? undefined);
  const channels = detail?.channels ?? [];
  const guildName = detail?.guild.name;
  const podeUsarSons = usePermissions(detail).can("USE_SOUNDBOARD");

  const ping = useVoicePing();
  // o endereço do SFU é o que dá pra mostrar como "onde a chamada está"
  const { data: config } = useAuthConfig();

  // a preferência de supressão vive nas configurações do usuário; aqui é atalho
  const noiseFilter = useVoicePrefs((s) => s.supressaoDeRuido);

  /**
   * A conta está numa chamada, mas não é esta aba. Sem mostrar isso, a barra
   * lateral diz que você está na Sala 1 e o painel some — parece contradição.
   */
  if (!channelId && accountChannelId) {
    const remote = channels.find((c) => c.id === accountChannelId);

    return (
      <div className="border-b border-black/20 bg-surface-1 px-3 py-2.5">
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
    <div className="group/voz border-b border-black/20 bg-surface-1 px-2 py-2">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="min-w-0">
          {/*
            Passar o mouse troca "Voz conectada" por "Detalhes de Voz"; clicar
            abre o gráfico. O estado é a informação do dia a dia — o número e o
            histórico só interessam quando alguém desconfia da conexão, e aí a
            pessoa já está com o mouse ali.

            As duas versões ocupam a MESMA célula de grid: empilhadas, a barra
            não pula de altura no hover.
          */}
          <VoiceDetailsPopover ping={ping} regiao={regiaoDaChamada(config?.voiceUrl)}>
            <button
              aria-label="Detalhes de voz"
              className="grid w-full text-left text-sm font-semibold"
            >
              <span className="col-start-1 row-start-1 flex items-center gap-1.5 text-online transition-opacity group-hover/voz:opacity-0">
                <IconeDeSinal ping={ping} /> Voz conectada
              </span>
              <span className="col-start-1 row-start-1 flex items-center gap-1.5 text-ink opacity-0 transition-opacity group-hover/voz:opacity-100">
                <IconeDeSinal ping={ping} /> Detalhes de Voz
              </span>
            </button>
          </VoiceDetailsPopover>
          {/*
            Clicar leva DE VOLTA pra chamada — servidor e canal. É o caminho de
            volta pra quem foi ver outra coisa e se perdeu: sem ele, a única
            forma de reencontrar a chamada é lembrar em que servidor ela estava.
          */}
          <button
            onClick={() => guildId && navigate(`/channels/${guildId}/${channelId}`)}
            disabled={!guildId}
            title="Voltar para a chamada"
            className="block max-w-full truncate text-left text-xs text-ink-muted transition hover:text-ink hover:underline disabled:cursor-default disabled:no-underline"
          >
            {channel?.name ?? "…"} {guildName ? `/ ${guildName}` : ""}
          </button>
        </div>

        {/*
          Os dois ficam juntos, encostados na direita. Soltos como filhos
          diretos do `justify-between`, o de supressão sobrava no meio da barra
          — parecia deslocado e ninguém associava ao controle da chamada.
        */}
        <div className="flex shrink-0 items-center gap-0.5">
          <Tooltip
            label={
              noiseFilterBusy
                ? "Aplicando…"
                : !noiseFilterAvailable
                  ? "Supressão avançada indisponível — usando a do navegador"
                  : noiseFilter
                    ? "Supressão de ruído fornecida por Krisp"
                    : "Supressão de ruído desligada"
            }
          >
            <button
              onClick={() => void toggleNoiseFilter()}
              aria-label="Supressão de ruído"
              aria-pressed={noiseFilter && noiseFilterAvailable}
              disabled={noiseFilterBusy}
              className={cn(
                "rounded p-2 transition hover:bg-surface-3 disabled:opacity-50",
                noiseFilterBusy && "animate-pulse",
                noiseFilter && noiseFilterAvailable ? "text-online" : "text-ink-muted hover:text-ink",
              )}
            >
              <AudioLines size={18} />
            </button>
          </Tooltip>

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

      {/*
        Só o que é da CHAMADA. Microfone e fone desceram pro painel do usuário:
        eles valem pra você em qualquer lugar, e não só enquanto há chamada —
        misturar os dois grupos fazia parecer que mutar dependia de estar em
        call.
      */}
      <div className="grid grid-cols-3 gap-1">
        <SoundboardPanel guildId={guildId ?? undefined} podeUsar={podeUsarSons} />

        <VoiceControl label="Câmera" onClick={() => void toggleCamera()}>
          {cameraEnabled ? <Video size={18} className="text-online" /> : <VideoOff size={18} />}
        </VoiceControl>

        <VoiceControl label="Compartilhar tela" onClick={() => void toggleScreen()}>
          <MonitorUp size={18} className={screenEnabled ? "text-online" : undefined} />
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

/**
 * "Microfone bloqueado" tem duas causas bem diferentes, e mandar a pessoa pro
 * lugar errado custa meia hora dela.
 *
 * No navegador é a permissão do site. No aplicativo, quase sempre é o macOS —
 * uma camada ANTES do Chromium, que o Gravaê não tem como conceder sozinho e
 * que fica numa tela que ninguém acha por acaso.
 */
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

/**
 * O sinalzinho. A cor acompanha a qualidade da conexão (verde, laranja,
 * vermelho) e o balão traz o número — que é o que a pessoa quer conferir de
 * relance, sem abrir nada.
 */
const IconeDeSinal: React.FC<{ ping: PingDaChamada }> = ({ ping }) => (
  <Tooltip label={ping.ms !== null ? `${ping.ms} ms` : "Medindo…"}>
    <span className={corDoPing(ping)}>
      <Signal size={16} />
    </span>
  </Tooltip>
);

/**
 * O nome que aparece nos detalhes. Não temos regiões como o LiveKit Cloud, e
 * inventar uma sigla seria pior que nada — então mostramos o host real do SFU,
 * que é a informação de verdade quando algo está lento.
 */
function regiaoDaChamada(url: string | undefined): string {
  if (!url) return "Servidor de voz";

  try {
    return new URL(url).hostname;
  } catch {
    return "Servidor de voz";
  }
}
