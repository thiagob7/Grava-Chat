import React, { useEffect } from "react";
import { useNavigate } from "react-router";
import { Phone, PhoneOff, Video } from "lucide-react";

import { useFindProfile } from "~/@core/application/queries/user/use-find-profile";
import { Avatar } from "~/features/perfil/components/Avatar";
import { refuseCall } from "~/@core/lib/websocket/emit-voice";
import { playSound } from "~/lib/ui-sounds";
import { useCallStore } from "~/features/voz/stores/chamada-store";
import { useVoiceStore } from "~/features/voz/stores/voice-store";
import { useTranslation } from "~/traducao";

const TEMPO_PLAYING_MS = 45_000;

const TOQUE_MS_INTERVAL = 2_400;

export const CallReceived: React.FC = () => {
  const { t } = useTranslation();
  const call = useCallStore((s) => s.playing);
  const end = useCallStore((s) => s.end);
  const joinCall = useVoiceStore((s) => s.join);
  const turnonCamera = useVoiceStore((s) => s.toggleCamera);
  const navigate = useNavigate();

  const { data: profile } = useFindProfile(call?.userId ?? null);

  const channelId = call?.channelId;
  const since = call?.since;

  useEffect(() => {
    if (!channelId || !since) return;

    playSound("playing");
    const toque = setInterval(() => playSound("playing"), TOQUE_MS_INTERVAL);
    const giveup = setTimeout(() => end(channelId), TEMPO_PLAYING_MS);

    return () => {
  const { t } = useTranslation();
      clearInterval(toque);
      clearTimeout(giveup);
    };
  }, [channelId, since, end]);

  if (!call) return null;

  const name = profile?.displayName ?? t("chamada.alguem");

  const answer = async (withVideo: boolean) => {
    end(call.channelId);
    navigate(`/dm/${call.channelId}`);

    await joinCall(call.channelId);
    if (withVideo && !useVoiceStore.getState().cameraEnabled) await turnonCamera();
  };

  const refuse = () => {
    end(call.channelId);
    void refuseCall(call.channelId).catch(() => undefined);
  };

  return (
    <div data-gc="voz.chamada-recebida.div" className="fixed right-4 top-4 z-[60] w-72 rounded-lg bg-surface-0 p-4 shadow-2xl ring-1 ring-line-sutil">
      <div data-gc="voz.chamada-recebida.div--2" className="flex items-center gap-3">
        <span data-gc="voz.chamada-recebida.span" className="relative">
          <Avatar data-gc="voz.chamada-recebida.avatar" id={call.userId} name={name} url={profile?.avatarUrl ?? null} size={44} />
          <span data-gc="voz.chamada-recebida.span--2" className="absolute inset-0 animate-ping rounded-full ring-2 ring-online" />
        </span>

        <span data-gc="voz.chamada-recebida.span--3" className="min-w-0 flex-1">
          <span data-gc="voz.chamada-recebida.span--4" className="block truncate font-semibold">{name}</span>
          <span data-gc="voz.chamada-recebida.span--5" className="flex items-center gap-1.5 text-xs text-ink-muted">
            {call.withVideo ? <Video data-gc="voz.chamada-recebida.video" size={12} /> : <Phone data-gc="voz.chamada-recebida.phone" size={12} />}
            {t(call.withVideo ? "chamada.deVideo" : "chamada.deVoz")}
          </span>
        </span>
      </div>

      <div data-gc="voz.chamada-recebida.div--3" className="mt-4 flex gap-2">
        <button data-gc="voz.chamada-recebida.button.refuse"
          onClick={refuse}
          className="flex flex-1 items-center justify-center gap-1.5 rounded bg-surface-3 px-3 py-2 text-sm font-medium transition hover:bg-danger hover:text-palco-ink"
        >
          <PhoneOff data-gc="voz.chamada-recebida.phone-off" size={15} /> Recusar
        </button>

        <button data-gc="voz.chamada-recebida.button"
          onClick={() => void answer(call.withVideo)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded bg-online px-3 py-2 text-sm font-medium text-ink transition hover:brightness-110"
        >
          {call.withVideo ? <Video data-gc="voz.chamada-recebida.video--2" size={15} /> : <Phone data-gc="voz.chamada-recebida.phone--2" size={15} />} Atender
        </button>
      </div>

      {call.withVideo && (
        <button data-gc="voz.chamada-recebida.button--2"
          onClick={() => void answer(false)}
          className="mt-2 w-full text-center text-xs text-ink-muted transition hover:text-ink hover:underline"
        >
          Atender sem câmera
        </button>
      )}
    </div>
  );
};
