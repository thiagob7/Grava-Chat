import React, { useEffect, useState } from "react";
import {
  Headphones,
  Maximize,
  Minimize,
  HeadphoneOff,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Video,
  VideoOff,
} from "lucide-react";

import { Tooltip } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import { useVoiceStore } from "~/stores/voice-store";

export const VoiceStageControls: React.FC<{ alvoTelaCheia?: React.RefObject<HTMLElement | null> }> = ({
  alvoTelaCheia,
}) => {
  const telaCheia = useTelaCheia(alvoTelaCheia);

  const {
    micEnabled,
    micBlocked,
    deafened,
    cameraEnabled,
    screenEnabled,
    toggleMic,
    toggleDeafen,
    toggleCamera,
    toggleScreen,
    leave,
  } = useVoiceStore();

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-4 flex justify-center",
        "opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100",
      )}
    >
      <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-surface-0/95 p-1.5 shadow-lg ring-1 ring-black/30 backdrop-blur">
        <Botao
          label={micBlocked ? "Microfone bloqueado" : micEnabled ? "Mutar" : "Desmutar"}
          onClick={() => void toggleMic()}
          ativo={micEnabled && !micBlocked}
        >
          {micEnabled && !micBlocked ? <Mic size={18} /> : <MicOff size={18} className="text-danger" />}
        </Botao>

        <Botao
          label={deafened ? "Ouvir" : "Ficar surdo"}
          onClick={() => void toggleDeafen()}
          ativo={!deafened}
        >
          {deafened ? <HeadphoneOff size={18} className="text-danger" /> : <Headphones size={18} />}
        </Botao>

        <Botao label="Câmera" onClick={() => void toggleCamera()} ativo={cameraEnabled}>
          {cameraEnabled ? <Video size={18} /> : <VideoOff size={18} />}
        </Botao>

        <Botao label="Compartilhar tela" onClick={() => void toggleScreen()} ativo={screenEnabled}>
          <MonitorUp size={18} />
        </Botao>

        <Botao
          label={telaCheia.ativa ? "Sair da tela cheia" : "Tela cheia"}
          onClick={() => void telaCheia.alternar()}
          ativo={telaCheia.ativa}
        >
          {telaCheia.ativa ? <Minimize size={18} /> : <Maximize size={18} />}
        </Botao>

        <span className="mx-0.5 h-6 w-px bg-white/10" aria-hidden />

        <Tooltip label="Desconectar">
          <button
            onClick={() => void leave()}
            aria-label="Desconectar"
            className="flex size-10 items-center justify-center rounded-full bg-danger text-white transition hover:brightness-110"
          >
            <PhoneOff size={18} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

interface BotaoProps {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  ativo?: boolean;
}

const Botao: React.FC<BotaoProps> = ({ children, label, onClick, ativo }) => (
  <Tooltip label={label}>
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={ativo}
      className={cn(
        "flex size-10 items-center justify-center rounded-full transition",
        ativo ? "bg-surface-3 text-ink hover:bg-surface-4" : "text-ink-muted hover:bg-surface-3 hover:text-ink",
      )}
    >
      {children}
    </button>
  </Tooltip>
);

function useTelaCheia(alvo?: React.RefObject<HTMLElement | null>) {
  const [ativa, setAtiva] = useState(false);

  useEffect(() => {
    const sincronizar = () => setAtiva(Boolean(document.fullscreenElement));

    sincronizar();
    document.addEventListener("fullscreenchange", sincronizar);
    return () => document.removeEventListener("fullscreenchange", sincronizar);
  }, []);

  const alternar = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await (alvo?.current ?? document.documentElement).requestFullscreen();
    } catch {
    }
  };

  return { ativa, alternar };
}
