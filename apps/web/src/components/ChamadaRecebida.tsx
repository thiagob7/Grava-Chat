import React, { useEffect } from "react";
import { useNavigate } from "react-router";
import { Phone, PhoneOff, Video } from "lucide-react";

import { useFindProfile } from "~/@core/application/queries/user/use-find-profile";
import { Avatar } from "~/components/Avatar";
import { recusarChamada } from "~/@core/lib/websocket/emit-voice";
import { tocarSom } from "~/lib/ui-sounds";
import { useChamadaStore } from "~/stores/chamada-store";
import { useVoiceStore } from "~/stores/voice-store";
import { useTranslation } from "~/traducao";

/**
 * Quanto tempo o telefone toca antes de desistir sozinho.
 *
 * Existe porque quem liga pode fechar o app, cair da rede ou desligar sem que
 * o "voice:left" chegue. Sem o teto, o cartão ficaria tocando para sempre, e a
 * pessoa teria que recusar uma chamada que já não existe.
 */
const TEMPO_TOCANDO_MS = 45_000;

/// A cada quanto o toque se repete. O som dura ~0,7s; 2,4s deixa o silêncio
/// entre eles, que é o que faz soar como telefone e não como alarme.
const INTERVALO_DO_TOQUE_MS = 2_400;

/**
 * O cartão de chamada recebida, com atender e recusar.
 *
 * Antes disso, uma chamada no privado chegava como um toast clicável: dava pra
 * atender, mas não pra dizer não. E recusar não é o mesmo que ignorar — quem
 * liga precisa saber a diferença entre "ele disse que não pode" e "ele não viu".
 *
 * Fica montado no topo do app, e não dentro da conversa, porque a ligação chega
 * pela sala de usuário: o telefone toca mesmo com a conversa fechada, num
 * servidor qualquer, ou na tela de amigos.
 */
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

  /// O toque e a desistência automática, os dois amarrados à mesma chamada.
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
    /// avisa o outro lado ANTES de sumir da tela daqui — sem isso, recusar e
    /// ignorar ficariam idênticos pra quem ligou
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

      {/*
        Atender uma chamada de vídeo sem abrir a câmera é um caso real — você
        quer ver, mas não ser visto. Só aparece quando há o que escolher.
      */}
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
