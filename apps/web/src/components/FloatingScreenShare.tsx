import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Maximize2, MonitorUp, MonitorX, X } from "lucide-react";

import { VoiceVideo } from "~/components/VoiceTrack";
import { encaixarNoCanto } from "~/lib/cantos";
import { useVoiceStore } from "~/stores/voice-store";
import { cn } from "~/lib/utils";

const MARGEM = 8;
const LARGURA = 320;
const ALTURA = 180;

export const FloatingScreenShare: React.FC = () => {
  const tiles = useVoiceStore((s) => s.tiles);
  const assistindo = useVoiceStore((s) => s.assistindo);
  const palcoVisivel = useVoiceStore((s) => s.palcoVisivel);
  const parar = useVoiceStore((s) => s.assistir);
  const encerrarTransmissao = useVoiceStore((s) => s.toggleScreen);
  const channelId = useVoiceStore((s) => s.channelId);
  const guildId = useVoiceStore((s) => s.guildId);
  const navigate = useNavigate();

  const alvo = assistindo ? tiles.find((t) => t.identity === assistindo && t.screenTrack) : null;
  const mostrar = Boolean(alvo) && !palcoVisivel;

  const area = useCallback(
    () => ({ largura: window.innerWidth, altura: window.innerHeight, margem: MARGEM }),
    [],
  );

  const [posicao, setPosicao] = useState(() =>
    encaixarNoCanto(
      { x: window.innerWidth, y: window.innerHeight, largura: LARGURA, altura: ALTURA },
      { largura: window.innerWidth, altura: window.innerHeight, margem: MARGEM },
    ),
  );

  const arrasto = useRef<{ dx: number; dy: number } | null>(null);
  /// enquanto o dedo está na tela o card segue o ponteiro; a transição só entra
  /// no pouso, senão o arrasto fica com atraso elástico
  const [pousando, setPousando] = useState(false);

  const limitar = useCallback(
    (x: number, y: number) => ({
      x: Math.min(Math.max(MARGEM, x), window.innerWidth - LARGURA - MARGEM),
      y: Math.min(Math.max(MARGEM, y), window.innerHeight - ALTURA - MARGEM),
    }),
    [],
  );

  useEffect(() => {
    const mover = (e: PointerEvent) => {
      if (!arrasto.current) return;
      setPosicao(limitar(e.clientX - arrasto.current.dx, e.clientY - arrasto.current.dy));
    };

    /*
      O pouso é o que mudou: antes o card ficava exatamente onde fosse largado,
      e o "exatamente onde" costumava ser em cima da conversa ou da lista de
      canais. Agora ele gruda no canto mais perto — o arrasto continua livre,
      só o destino é que é decidido.
    */
    const soltar = () => {
      if (!arrasto.current) return;
      arrasto.current = null;

      setPousando(true);
      setPosicao((p) => encaixarNoCanto({ ...p, largura: LARGURA, altura: ALTURA }, area()));
    };

    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);

    return () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
    };
  }, [limitar, area]);

  /// Redimensionar a janela reencaixa: o canto de antes pode nem existir mais.
  useEffect(() => {
    const ajustar = () =>
      setPosicao((p) => encaixarNoCanto({ ...p, largura: LARGURA, altura: ALTURA }, area()));

    window.addEventListener("resize", ajustar);
    return () => window.removeEventListener("resize", ajustar);
  }, [area]);

  if (!mostrar || !alvo) return null;

  return (
    <div
      style={{ left: posicao.x, top: posicao.y, width: LARGURA, height: ALTURA }}
      className={cn(
        "group/mini fixed z-40 overflow-hidden rounded-lg bg-black shadow-2xl ring-1 ring-white/10",
        pousando && "transition-[left,top] duration-200 ease-out",
      )}
    >
      <VoiceVideo track={alvo.screenTrack!} />

      <div
        onPointerDown={(e) => {
          setPousando(false);
          arrasto.current = { dx: e.clientX - posicao.x, dy: e.clientY - posicao.y };
        }}
        style={{ touchAction: "none" }}
        className="absolute inset-x-0 top-0 flex cursor-grab items-center gap-1.5 bg-gradient-to-b from-black/85 to-transparent px-2 py-1.5 active:cursor-grabbing"
      >
        <MonitorUp size={12} className="shrink-0 text-online" />
        <span className="min-w-0 flex-1 truncate text-xs font-medium">{alvo.name}</span>

        <BotaoDaMini
          label="Voltar para a chamada"
          onClick={() => guildId && channelId && navigate(`/channels/${guildId}/${channelId}`)}
        >
          <Maximize2 size={12} />
        </BotaoDaMini>

        {/*
          Dois botões, e a diferença entre eles é o ponto: o X só fecha a
          janelinha (a live continua no ar), o monitor com X derruba a
          transmissão. Antes só existia o primeiro, e pra encerrar de verdade
          era preciso voltar até a chamada.

          A barra também não some mais no hover — ela É a saída daqui, e uma
          saída que só aparece quando o mouse passa por cima não é uma saída.
        */}
        {alvo.isLocal && (
          <BotaoDaMini label="Encerrar a transmissão" onClick={() => void encerrarTransmissao()}>
            <MonitorX size={12} className="text-danger" />
          </BotaoDaMini>
        )}

        <BotaoDaMini label="Parar de assistir" onClick={() => parar(null)}>
          <X size={12} />
        </BotaoDaMini>
      </div>
    </div>
  );
};

const BotaoDaMini: React.FC<{
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ children, label, onClick }) => (
  <button
    onPointerDown={(e) => e.stopPropagation()}
    onClick={onClick}
    title={label}
    aria-label={label}
    className="shrink-0 rounded p-1 text-ink-muted transition hover:bg-white/15 hover:text-ink"
  >
    {children}
  </button>
);
