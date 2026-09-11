import type { PendingMessageModel } from "~/@core/domain/models/message-model";
import { useAppearance } from "~/features/configuracoes/stores/aparencia";
import { useIgnoreStore } from "~/stores/ignore-store";
import { asSpeech, speak } from "~/lib/voz";

export function readVoice(
  message: PendingMessageModel,
  myId: string | undefined,
  channelIsOpen: string | null | undefined,
): void {
  const prefs = useAppearance.getState();

  if (prefs.readVoiceHigh === "nunca") return;
  if (
    prefs.readVoiceHigh === "canal-aberto" &&
    message.channelId !== channelIsOpen
  )
    return;

  if (myId && message.author.id === myId) return;

  if (useIgnoreStore.getState().thisIgnored(message.author.id)) return;

  if (prefs.modeStreamer && prefs.streamerWithoutSound) return;

  speak(
    asSpeech({
      author: message.author.displayName,
      text: message.content ?? "",
    }),
    {
      voice: prefs.readingVoice,
      speed: prefs.readingSpeed,
    },
  );
}
