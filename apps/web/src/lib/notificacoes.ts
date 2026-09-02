import type { Message } from "@gravae/shared";

import { prefsDeAviso } from "~/stores/notificacoes";
import { prefsDeAparencia } from "~/stores/aparencia";
import { tocarSom } from "~/lib/ui-sounds";

/**
 * O aviso de mensagem nova.
 *
 * Três decisões moram aqui, e as três são sobre QUANDO CALAR:
 *
 * 1. Mensagem sua nunca avisa.
 * 2. Canal aberto com a janela em foco não avisa — você está lendo.
 * 3. Menção sempre passa, mesmo no canal aberto, se a janela estiver atrás.
 *
 * Sem a segunda, o app apitava a cada linha de uma conversa que você estava
 * acompanhando ao vivo.
 */

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
  /// o canal que está aberto na tela agora
  canalAberto: string | undefined;
  meMenciona: boolean;
  nomeDoCanal: string | undefined;
  ehDm: boolean;
  ignorado: boolean;
  onAbrir: () => void;
}

/// Um resumo curto do que chegou. Anexo sem texto não pode virar aviso vazio.
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
  /*
    O canal manda mais que a preferência geral: quem silenciou um canal
    específico não quer ouvi-lo nem quando a regra geral diz "me avise de
    tudo" — e quem pediu "tudo" num canal não quer perdê-lo por causa do
    "só menções" global.
  */
  const doCanal = prefs.porCanal[message.channelId] ?? null;
  if (doCanal === "nada") return;
  const emFoco = typeof document !== "undefined" && document.visibilityState === "visible" && document.hasFocus();
  const lendoEsteCanal = emFoco && canalAberto === message.channelId;

  /// DM é conversa de duas pessoas: ali toda mensagem conta como chamada.
  const importante = meMenciona || ehDm;

  if (lendoEsteCanal && !meMenciona) return;
  if (doCanal === "mencoes" && !meMenciona) return;
  if (doCanal === null && prefs.soMencoes && !importante) return;

  if (prefs.som && !lendoEsteCanal) tocarSom(importante ? "mencao" : "mensagem");

  if (!prefs.aviso || emFoco) return;
  if (permissaoDeAviso() !== "concedida") return;

  /// Transmitindo: a janelinha do sistema aparece por cima de tudo, inclusive
  /// do que está sendo gravado. É o vazamento mais fácil de acontecer.
  const aparencia = prefsDeAparencia();
  if (aparencia.modoStreamer && aparencia.streamerSemAvisos) return;

  const onde = ehDm ? "" : nomeDoCanal ? ` · #${nomeDoCanal}` : "";

  try {
    const aviso = new Notification(`${message.author.displayName}${onde}`, {
      body: corpoDoAviso(message),
      icon: message.author.avatarUrl ?? "/favicon.ico",
      /// Uma janelinha por canal: dez mensagens seguidas do mesmo canal
      /// substituem a anterior em vez de empilhar dez avisos.
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
