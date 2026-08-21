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

/**
 * Os controles da chamada flutuando sobre o palco, como no Discord.
 *
 * Já existem os mesmos botões no painel lateral — mas quem está numa chamada
 * olha pro palco, e atravessar a tela pra mutar é o tipo de atrito que só
 * aparece no uso. Aqui eles ficam onde a mão já está.
 *
 * Aparecem no hover pra não competir com o vídeo. `focus-within` está junto de
 * propósito: quem navega por teclado nunca dispara hover, e sem isso os botões
 * receberiam foco continuando invisíveis.
 */
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
        // some suave, mas aparece na hora: esperar pra revelar irrita
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

        {/* separador: desligar não pode ser clicado por engano no meio dos outros */}
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
  /** ligado = verde; desligado = cinza. O vermelho fica só pro que está cortado. */
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

/**
 * Tela cheia do palco da chamada.
 *
 * O estado NÃO é um `useState` que o botão alterna: o navegador tem o próprio
 * (Esc sai, F11 entra, e a barra do sistema também mexe). Guardar uma cópia
 * daria botão dessincronizado na primeira vez que alguém apertasse Esc — por
 * isso o `fullscreenchange` é a única fonte da verdade.
 */
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
      // Safari e alguns gerenciadores de janela recusam sem gesto direto; o
      // botão simplesmente não faz nada, que é melhor que um erro na tela
    }
  };

  return { ativa, alternar };
}
