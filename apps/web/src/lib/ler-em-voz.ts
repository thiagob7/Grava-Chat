import type { PendingMessageModel } from "~/@core/domain/models/message-model";
import { useAparencia } from "~/stores/aparencia";
import { useIgnoreStore } from "~/stores/ignore-store";
import { comoSeFala, falar } from "~/lib/voz";

/**
 * A mensagem que chegou, dita em voz alta — quando a pessoa pediu isso.
 *
 * Mora fora do `use-realtime` porque as regras de QUEM não é lido são várias e
 * cada uma tem um motivo diferente. Juntas num `if` gigante dentro do handler,
 * ninguém consegue mudar uma sem reler as outras.
 */
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

  /// A minha própria mensagem eu acabei de escrever. Ouvir de volta o que
  /// você digitou não informa nada e atrapalha quem está escrevendo a próxima.
  if (meuId && message.author.id === meuId) return;

  /// Quem foi silenciado foi silenciado inteiro. Ler em voz o que a pessoa
  /// escondeu da tela seria a pior forma possível de desrespeitar a escolha.
  if (useIgnoreStore.getState().estaIgnorado(message.author.id)) return;

  /*
    Modo streamer cala a voz junto com os sons.

    Quem ligou o modo streamer está transmitindo, e uma voz sintetizada lendo
    a conversa vai direto pro áudio da live — inclusive a mensagem privada que
    ninguém deveria ouvir.
  */
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
