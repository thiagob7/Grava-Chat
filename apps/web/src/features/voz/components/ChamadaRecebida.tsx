import React, { useEffect } from "react";
import { useNavigate } from "react-router";
import { Phone, PhoneOff, Video } from "lucide-react";

import { useFindProfile } from "~/@core/application/queries/user/use-find-profile";
import { Avatar } from "~/components/Avatar";
import { recusarChamada } from "~/@core/lib/websocket/emit-voice";
import { tocarSom } from "~/lib/ui-sounds";
import { useChamadaStore } from "~/features/voz/stores/chamada-store";
import { useVoiceStore } from "~/features/voz/stores/voice-store";
import { useTranslation } from "~/traducao";

const TEMPO_TOCANDO_MS = 45_000;

const INTERVALO_DO_TOQUE_MS = 2_400;

export const ChamadaRecebida: React.FC = () => {
  const { t } = useTranslation();
  const chamada = useChamadaStore((s) => s.tocando);
  const encerrar = useChamadaStore((s) => s.encerrar);
  const entrarNaChamada = useVoiceStore((s) => s.join);
  const ligarCamera = useVoiceStore((s) => s.toggleCamera);
  const navigate = useNavigate();

  const { data: perfil } = useFindProfile(chamada?.userId ?? null);

  const channelId = chamada?.channelId;
  const desde = chamada?.desde;

  useEffect(() => {
    if (!channelId || !desde) return;

    tocarSom("tocando");
    const toque = setInterval(() => tocarSom("tocando"), INTERVALO_DO_TOQUE_MS);
    const desistir = setTimeout(() => encerrar(channelId), TEMPO_TOCANDO_MS);

    return () => {
  const { t } = useTranslation();
      clearInterval(toque);
      clearTimeout(desistir);
    };
  }, [channelId, desde, encerrar]);

  if (!chamada) return null;

  const nome = perfil?.displayName ?? t("chamada.alguem");

  const atender = async (comVideo: boolean) => {
    encerrar(chamada.channelId);
    navigate(`/dm/${chamada.channelId}`);

    await entrarNaChamada(chamada.channelId);
    if (comVideo && !useVoiceStore.getState().cameraEnabled) await ligarCamera();
  };

  const recusar = () => {
    encerrar(chamada.channelId);
    void recusarChamada(chamada.channelId).catch(() => undefined);
  };

  return (
    <div className="fixed right-4 top-4 z-[60] w-72 rounded-lg bg-surface-0 p-4 shadow-2xl ring-1 ring-white/10">
      <div className="flex items-center gap-3">
        <span className="relative">
          <Avatar id={chamada.userId} name={nome} url={perfil?.avatarUrl ?? null} size={44} />
          <span className="absolute inset-0 animate-ping rounded-full ring-2 ring-online" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{nome}</span>
          <span className="flex items-center gap-1.5 text-xs text-ink-muted">
            {chamada.comVideo ? <Video size={12} /> : <Phone size={12} />}
            {t(chamada.comVideo ? "chamada.deVideo" : "chamada.deVoz")}
          </span>
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={recusar}
          className="flex flex-1 items-center justify-center gap-1.5 rounded bg-surface-3 px-3 py-2 text-sm font-medium transition hover:bg-danger hover:text-white"
        >
          <PhoneOff size={15} /> Recusar
        </button>

        <button
          onClick={() => void atender(chamada.comVideo)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded bg-online px-3 py-2 text-sm font-medium text-black transition hover:brightness-110"
        >
          {chamada.comVideo ? <Video size={15} /> : <Phone size={15} />} Atender
        </button>
      </div>

      {chamada.comVideo && (
        <button
          onClick={() => void atender(false)}
          className="mt-2 w-full text-center text-xs text-ink-muted transition hover:text-ink hover:underline"
        >
          Atender sem câmera
        </button>
      )}
    </div>
  );
};
