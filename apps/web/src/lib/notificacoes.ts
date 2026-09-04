import type { Message } from "@gravae/shared";

import { prefsDeAviso } from "~/stores/notificacoes";
import { prefsDeAparencia } from "~/features/configuracoes/stores/aparencia";
import { tocarSom } from "~/lib/ui-sounds";

export type PermissaoDeAviso = "concedida" | "negada" | "perguntar" | "indisponivel";

export function permissaoDeAviso(): PermissaoDeAviso {
  if (typeof Notification === "undefined") return "indisponivel";

  return Notification.permission === "granted"
    ? "concedida"
    : Notification.permission === "denied"
      ? "negada"
      : "perguntar";
}

export async function pedirPermissaoDeAviso(): Promise<PermissaoDeAviso> {
  if (typeof Notification === "undefined") return "indisponivel";
  if (Notification.permission !== "default") return permissaoDeAviso();

  await Notification.requestPermission().catch(() => undefined);
  return permissaoDeAviso();
}

interface Contexto {
  message: Message;
  meuId: string | undefined;
  canalAberto: string | undefined;
  meMenciona: boolean;
  nomeDoCanal: string | undefined;
  ehDm: boolean;
  ignorado: boolean;
  onAbrir: () => void;
}

function corpoDoAviso(message: Message) {
  const texto = message.content
    /// menções vão como `<@id>` no texto cru; no aviso viram o nome só quando
    /// não dá para resolver — melhor "@alguém" que um id de 24 caracteres
    .replace(/<@&?[a-f\d]{24}>/gi, "@alguém")
    .replace(/<a?:(\w+):\d+>/g, ":$1:")
    .trim();

  if (texto) return texto.length > 180 ? `${texto.slice(0, 179)}…` : texto;
  if (message.attachments.length) return "Mandou um anexo";
  if (message.sticker) return "Mandou uma figurinha";
  if (message.poll) return "Criou uma enquete";

  return "Mandou uma mensagem";
}

export function avisarDeMensagem({
  message,
  meuId,
  canalAberto,
  meMenciona,
  nomeDoCanal,
  ehDm,
  ignorado,
  onAbrir,
}: Contexto) {
  if (!meuId || message.author.id === meuId || ignorado) return;

  const prefs = prefsDeAviso();
  const doCanal = prefs.porCanal[message.channelId] ?? null;
  if (doCanal === "nada") return;
  const emFoco = typeof document !== "undefined" && document.visibilityState === "visible" && document.hasFocus();
  const lendoEsteCanal = emFoco && canalAberto === message.channelId;

  const importante = meMenciona || ehDm;

  if (lendoEsteCanal && !meMenciona) return;
  if (doCanal === "mencoes" && !meMenciona) return;
  if (doCanal === null && prefs.soMencoes && !importante) return;

  if (prefs.som && !lendoEsteCanal) tocarSom(importante ? "mencao" : "mensagem");

  if (!prefs.aviso || emFoco) return;
  if (permissaoDeAviso() !== "concedida") return;

  const aparencia = prefsDeAparencia();
  if (aparencia.modoStreamer && aparencia.streamerSemAvisos) return;

  const onde = ehDm ? "" : nomeDoCanal ? ` · #${nomeDoCanal}` : "";

  try {
    const aviso = new Notification(`${message.author.displayName}${onde}`, {
      body: corpoDoAviso(message),
      icon: message.author.avatarUrl ?? "/favicon.ico",
      tag: message.channelId,
      renotify: importante,
      silent: true,
    } as NotificationOptions & { renotify: boolean });

    aviso.onclick = () => {
      window.focus();
      void window.gravae?.janela?.focar();
      onAbrir();
      aviso.close();
    };
  } catch {
    /// Safari em aba não segura, permissão revogada no meio do caminho: o som
    /// já tocou, e o contador no título continua contando.
  }
}
