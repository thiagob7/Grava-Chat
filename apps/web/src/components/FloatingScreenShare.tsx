import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Maximize2, MonitorUp, X } from "lucide-react";

import { VoiceVideo } from "~/components/VoiceTrack";
import { useVoiceStore } from "~/stores/voice-store";

const MARGEM = 8;
const LARGURA = 320;
const ALTURA = 180;

export const FloatingScreenShare: React.FC = () => {
  const tiles = useVoiceStore((s) => s.tiles);
  const assistindo = useVoiceStore((s) => s.assistindo);
  const palcoVisivel = useVoiceStore((s) => s.palcoVisivel);
  const parar = useVoiceStore((s) => s.assistir);
  const channelId = useVoiceStore((s) => s.channelId);
  const guildId = useVoiceStore((s) => s.guildId);
  const navigate = useNavigate();

  const alvo = assistindo ? tiles.find((t) => t.identity === assistindo && t.screenTrack) : null;
  const mostrar = Boolean(alvo) && !palcoVisivel;

  const [posicao, setPosicao] = useState(() => ({
    x: window.innerWidth - LARGURA - 24,
    y: window.innerHeight - ALTURA - 24,
  }));

  const arrasto = useRef<{ dx: number; dy: number } | null>(null);

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

    const soltar = () => {
      arrasto.current = null;
    };

    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);

    return () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
    };
  }, [limitar]);

  useEffect(() => {
    const ajustar = () => setPosicao((p) => limitar(p.x, p.y));

    window.addEventListener("resize", ajustar);
    return () => window.removeEventListener("resize", ajustar);
  }, [limitar]);

  if (!mostrar || !alvo) return null;

  return (
    <div
      style={{ left: posicao.x, top: posicao.y, width: LARGURA, height: ALTURA }}
      className="group/mini fixed z-40 overflow-hidden rounded-lg bg-black shadow-2xl ring-1 ring-white/10"
    >
      <VoiceVideo track={alvo.screenTrack!} />

      <div
        onPointerDown={(e) => {
          arrasto.current = { dx: e.clientX - posicao.x, dy: e.clientY - posicao.y };
        }}
        style={{ touchAction: "none" }}
        className="absolute inset-x-0 top-0 flex cursor-grab items-center gap-1.5 bg-gradient-to-b from-black/80 to-transparent px-2 py-1.5 opacity-0 transition group-hover/mini:opacity-100 active:cursor-grabbing"
      >
        <MonitorUp size={12} className="shrink-0 text-online" />
        <span className="min-w-0 flex-1 truncate text-xs font-medium">{alvo.name}</span>

        <BotaoDaMini
          label="Voltar para a chamada"
          onClick={() => guildId && channelId && navigate(`/channels/${guildId}/${channelId}`)}
        >
          <Maximize2 size={12} />
        </BotaoDaMini>

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
