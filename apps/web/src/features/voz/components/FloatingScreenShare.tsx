import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Expand, Maximize2, MonitorUp, MonitorX, Shrink, X } from "lucide-react";

import { VoiceVideo } from "~/features/voz/components/VoiceTrack";
import { useScreenFull } from "~/features/voz/hooks/use-tela-cheia";
import { fitCorner } from "~/features/voz/lib/cantos";
import { useVoiceStore } from "~/features/voz/stores/voice-store";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

const MARGIN = 8;
const WIDTH = 320;
const HEIGHT = 180;

export const FloatingScreenShare: React.FC = () => {
  const { t } = useTranslation();
  const tiles = useVoiceStore((s) => s.tiles);
  const watching = useVoiceStore((s) => s.watching);
  const visibleStage = useVoiceStore((s) => s.visibleStage);
  const stop = useVoiceStore((s) => s.watch);
  const endBroadcast = useVoiceStore((s) => s.toggleScreen);
  const channelId = useVoiceStore((s) => s.channelId);
  const guildId = useVoiceStore((s) => s.guildId);
  const navigate = useNavigate();

  const target = watching ? tiles.find((t) => t.identity === watching && t.screenTrack) : null;
  const show = Boolean(target) && !visibleStage;

  const area = useCallback(
    () => ({ width: window.innerWidth, height: window.innerHeight, margin: MARGIN }),
    [],
  );

  const [position, setPosition] = useState(() =>
    fitCorner(
      { x: window.innerWidth, y: window.innerHeight, width: WIDTH, height: HEIGHT },
      { width: window.innerWidth, height: window.innerHeight, margin: MARGIN },
    ),
  );

  const mini = useRef<HTMLDivElement>(null);
  const fullScreen = useScreenFull(mini);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const [landing, setLanding] = useState(false);

  const limit = useCallback(
    (x: number, y: number) => ({
      x: Math.min(Math.max(MARGIN, x), window.innerWidth - WIDTH - MARGIN),
      y: Math.min(Math.max(MARGIN, y), window.innerHeight - HEIGHT - MARGIN),
    }),
    [],
  );

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!drag.current) return;
      setPosition(limit(e.clientX - drag.current.dx, e.clientY - drag.current.dy));
    };

    const drop = () => {
      if (!drag.current) return;
      drag.current = null;

      setLanding(true);
      setPosition((p) => fitCorner({ ...p, width: WIDTH, height: HEIGHT }, area()));
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", drop);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", drop);
    };
  }, [limit, area]);

  useEffect(() => {
    const adjust = () =>
      setPosition((p) => fitCorner({ ...p, width: WIDTH, height: HEIGHT }, area()));

    window.addEventListener("resize", adjust);
    return () => window.removeEventListener("resize", adjust);
  }, [area]);

  if (!show || !target) return null;

  return (
    <div data-gc="voz.floating-screen-share.div"
      ref={mini}
      style={fullScreen.active ? undefined : { left: position.x, top: position.y, width: WIDTH, height: HEIGHT }}
      className={cn(
        "group/mini regiao-sem-arrasto fixed z-40 overflow-hidden bg-palco",
        fullScreen.active ? "inset-0" : "rounded-lg shadow-2xl ring-1 ring-line-sutil",
        landing && !fullScreen.active && "transition-[left,top] duration-200 ease-out",
      )}
    >
      <VoiceVideo data-gc="voz.floating-screen-share.voice-video" track={target.screenTrack!} />

      <div data-gc="voz.floating-screen-share.div--2"
        onPointerDown={(e) => {
          if (fullScreen.active) return;

          setLanding(false);
          drag.current = { dx: e.clientX - position.x, dy: e.clientY - position.y };
        }}
        style={{ touchAction: "none" }}
        className="absolute inset-x-0 top-0 flex cursor-grab items-center gap-1.5 bg-gradient-to-b from-palco/85 to-transparent px-2 py-1.5 active:cursor-grabbing"
      >
        <MonitorUp data-gc="voz.floating-screen-share.monitor-up" size={12} className="shrink-0 text-online" />
        <span data-gc="voz.floating-screen-share.span" className="min-w-0 flex-1 truncate text-xs font-medium">{target.name}</span>

        <MiniButton data-gc="voz.floating-screen-share.mini-button"
          label={fullScreen.active ? "Sair da tela cheia (Esc)" : "Tela cheia"}
          onClick={() => void fullScreen.toggle()}
        >
          {fullScreen.active ? <Shrink data-gc="voz.floating-screen-share.shrink" size={12} /> : <Expand data-gc="voz.floating-screen-share.expand" size={12} />}
        </MiniButton>

        <MiniButton data-gc="voz.floating-screen-share.mini-button--2"
          label={t("chamada.voltar")}
          onClick={() => guildId && channelId && navigate(`/channels/${guildId}/${channelId}`)}
        >
          <Maximize2 data-gc="voz.floating-screen-share.maximize2" size={12} />
        </MiniButton>

        {target.isLocal && (
          <MiniButton data-gc="voz.floating-screen-share.mini-button--3" label={t("chamada.tela.encerrarTransmissao")} onClick={() => void endBroadcast()}>
            <MonitorX data-gc="voz.floating-screen-share.monitor-x" size={12} className="text-danger" />
          </MiniButton>
        )}

        <MiniButton data-gc="voz.floating-screen-share.mini-button--4" label={t("chamada.live.pararDeAssistir")} onClick={() => stop(null)}>
          <X data-gc="voz.floating-screen-share.x" size={12} />
        </MiniButton>
      </div>
    </div>
  );
};

const MiniButton: React.FC<{
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ children, label, onClick }) => (
  <button data-gc="voz.floating-screen-share.button.on-click"
    onPointerDown={(e) => e.stopPropagation()}
    onClick={onClick}
    title={label}
    aria-label={label}
    className="shrink-0 rounded p-1 text-ink-muted transition hover:bg-palco-ink/15 hover:text-ink"
  >
    {children}
  </button>
);
