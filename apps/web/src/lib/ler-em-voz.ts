import type { PendingMessageModel } from "~/@core/domain/models/message-model";
import { useAparencia } from "~/stores/aparencia";
import { useIgnoreStore } from "~/stores/ignore-store";
import { comoSeFala, falar } from "~/lib/voz";

export function lerEmVoz(
  message: PendingMessageModel,
  meuId: string | undefined,
  canalAberto: string | null | undefined,
): void {
  const prefs = useAparencia.getState();

  if (prefs.lerEmVozAlta === "nunca") return;
  if (
    prefs.lerEmVozAlta === "canal-aberto" &&
    message.channelId !== canalAberto
  )
    return;

  if (meuId && message.author.id === meuId) return;

  if (useIgnoreStore.getState().estaIgnorado(message.author.id)) return;

  if (prefs.modoStreamer && prefs.streamerSemSom) return;

  falar(
    comoSeFala({
      autor: message.author.displayName,
      texto: message.content ?? "",
    }),
    {
      voz: prefs.vozDaLeitura,
      velocidade: prefs.velocidadeDaLeitura,
    },
  );
}
