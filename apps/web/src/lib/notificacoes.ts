import type { Message } from "@gravae/shared";

import { noticePrefs, serverMuted } from "~/stores/notificacoes";
import { appearancePrefs } from "~/features/configuracoes/stores/aparencia";
import { playSound } from "~/lib/ui-sounds";
import { desktop } from "~/lib/desktop";

export type NoticePermission = "concedida" | "negada" | "perguntar" | "unavailable";

export function noticePermission(): NoticePermission {
  if (typeof Notification === "undefined") return "unavailable";

  return Notification.permission === "granted"
    ? "concedida"
    : Notification.permission === "denied"
      ? "negada"
      : "perguntar";
}

export async function noticeRequestPermission(): Promise<NoticePermission> {
  if (typeof Notification === "undefined") return "unavailable";
  if (Notification.permission !== "default") return noticePermission();

  await Notification.requestPermission().catch(() => undefined);
  return noticePermission();
}

interface Context {
  guildId?: string | null;
  message: Message;
  myId: string | undefined;
  channelIsOpen: string | undefined;
  mention: { direct: boolean; everyone: boolean; role: boolean };
  channelName: string | undefined;
  isDm: boolean;
  ignored: boolean;
  onOpen: () => void;
}

function noticeBody(message: Message) {
  const text = message.content
    .replace(/<@&?[a-f\d]{24}>/gi, "@alguém")
    .replace(/<a?:(\w+):\d+>/g, ":$1:")
    .trim();

  if (text) return text.length > 180 ? `${text.slice(0, 179)}…` : text;
  if (message.attachments.length) return "Mandou um anexo";
  if (message.sticker) return "Mandou uma figurinha";
  if (message.poll) return "Criou uma enquete";

  return "Mandou uma mensagem";
}

export function notifyMessage({
  message,
  myId,
  channelIsOpen,
  mention,
  channelName,
  isDm,
  ignored,
  onOpen,
  guildId,
}: Context) {
  if (!myId || message.author.id === myId || ignored) return;

  const prefs = noticePrefs();
  const fromServerPrefs = guildId ? prefs.byServer[guildId] : undefined;

  const meMentions =
    mention.direct ||
    (mention.everyone && fromServerPrefs?.everyone !== false) ||
    (mention.role && fromServerPrefs?.roleList !== false);

  const fromChannel = prefs.byChannel[message.channelId] ?? null;
  if (fromChannel === "nada") return;

  if (serverMuted(prefs, guildId)) return;
  const fromServer = fromServerPrefs?.mode ?? null;
  if (fromServer === "nada") return;
  if (fromServer === "mencoes" && !meMentions) return;
  const inFocus = typeof document !== "undefined" && document.visibilityState === "visible" && document.hasFocus();
  const readingThisChannel = inFocus && channelIsOpen === message.channelId;

  const important = meMentions || isDm;

  if (readingThisChannel && !meMentions) return;
  if (fromChannel === "mencoes" && !meMentions) return;
  if (fromChannel === null && prefs.soMentions && !important) return;

  if (prefs.sound && !readingThisChannel) playSound(important ? "mention" : "message");

  if (!prefs.notice || inFocus) return;
  if (noticePermission() !== "concedida") return;

  const appearance = appearancePrefs();
  if (appearance.modeStreamer && appearance.streamerWithoutNotices) return;

  const where = isDm ? "" : channelName ? ` · #${channelName}` : "";

  try {
    const notice = new Notification(`${message.author.displayName}${where}`, {
      body: noticeBody(message),
      icon: message.author.avatarUrl ?? "/favicon.ico",
      tag: message.channelId,
      renotify: important,
      silent: true,
    } as NotificationOptions & { renotify: boolean });

    notice.onclick = () => {
      window.focus();
      void desktop()?.appWindow.focus();
      onOpen();
      notice.close();
    };
  } catch {
  }
}
