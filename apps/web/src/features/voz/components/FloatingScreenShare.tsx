import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Expand, Maximize2, MonitorUp, MonitorX, Shrink, X } from "lucide-react";

import { VoiceVideo } from "~/features/voz/components/VoiceTrack";
import { useTelaCheia } from "~/features/voz/hooks/use-tela-cheia";
import { encaixarNoCanto } from "~/features/voz/lib/cantos";
import { useVoiceStore } from "~/features/voz/stores/voice-store";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

const MARGEM = 8;
const LARGURA = 320;
const ALTURA = 180;

export const FloatingScreenShare: React.FC = () => {
  const { t } = useTranslation();
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

  const mini = useRef<HTMLDivElement>(null);
  const telaCheia = useTelaCheia(mini);
  const arrasto = useRef<{ dx: number; dy: number } | null>(null);
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

  useEffect(() => {
    const ajustar = () =>
      setPosicao((p) => encaixarNoCanto({ ...p, largura: LARGURA, altura: ALTURA }, area()));

    window.addEventListener("resize", ajustar);
    return () => window.removeEventListener("resize", ajustar);
  }, [area]);

  if (!mostrar || !alvo) return null;

  return (
    <div data-gc="voz.floating-screen-share.div"
      ref={mini}
      style={telaCheia.ativa ? undefined : { left: posicao.x, top: posicao.y, width: LARGURA, height: ALTURA }}
      className={cn(
        "group/mini regiao-sem-arrasto fixed z-40 overflow-hidden bg-black",
        telaCheia.ativa ? "inset-0" : "rounded-lg shadow-2xl ring-1 ring-white/10",
        pousando && !telaCheia.ativa && "transition-[left,top] duration-200 ease-out",
      )}
    >
      <VoiceVideo data-gc="voz.floating-screen-share.voice-video" track={alvo.screenTrack!} />

      <div data-gc="voz.floating-screen-share.div--2"
        onPointerDown={(e) => {
          if (telaCheia.ativa) return;

          setPousando(false);
          arrasto.current = { dx: e.clientX - posicao.x, dy: e.clientY - posicao.y };
        }}
        style={{ touchAction: "none" }}
        className="absolute inset-x-0 top-0 flex cursor-grab items-center gap-1.5 bg-gradient-to-b from-black/85 to-transparent px-2 py-1.5 active:cursor-grabbing"
      >
        <MonitorUp data-gc="voz.floating-screen-share.monitor-up" size={12} className="shrink-0 text-online" />
        <span data-gc="voz.floating-screen-share.span" className="min-w-0 flex-1 truncate text-xs font-medium">{alvo.name}</span>

        <BotaoDaMini data-gc="voz.floating-screen-share.botao-da-mini"
          label={telaCheia.ativa ? "Sair da tela cheia (Esc)" : "Tela cheia"}
          onClick={() => void telaCheia.alternar()}
        >
          {telaCheia.ativa ? <Shrink data-gc="voz.floating-screen-share.shrink" size={12} /> : <Expand data-gc="voz.floating-screen-share.expand" size={12} />}
        </BotaoDaMini>

        <BotaoDaMini data-gc="voz.floating-screen-share.botao-da-mini--2"
          label={t("chamada.voltar")}
          onClick={() => guildId && channelId && navigate(`/channels/${guildId}/${channelId}`)}
        >
          <Maximize2 data-gc="voz.floating-screen-share.maximize2" size={12} />
        </BotaoDaMini>

        {alvo.isLocal && (
          <BotaoDaMini data-gc="voz.floating-screen-share.botao-da-mini--3" label={t("chamada.tela.encerrarTransmissao")} onClick={() => void encerrarTransmissao()}>
            <MonitorX data-gc="voz.floating-screen-share.monitor-x" size={12} className="text-danger" />
          </BotaoDaMini>
        )}

        <BotaoDaMini data-gc="voz.floating-screen-share.botao-da-mini--4" label={t("chamada.live.pararDeAssistir")} onClick={() => parar(null)}>
          <X data-gc="voz.floating-screen-share.x" size={12} />
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
  <button data-gc="voz.floating-screen-share.button.on-click"
    onPointerDown={(e) => e.stopPropagation()}
    onClick={onClick}
    title={label}
    aria-label={label}
    className="shrink-0 rounded p-1 text-ink-muted transition hover:bg-white/15 hover:text-ink"
  >
    {children}
  </button>
);
