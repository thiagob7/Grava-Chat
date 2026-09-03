import Redis from "ioredis";
import { env } from "~/env.js";

export const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

/*
  Sem ouvinte de `error`, o Node trata o evento como exceção não capturada e
  DERRUBA o processo — foi assim que um ECONNRESET do Redis matou a API inteira
  em desenvolvimento, e o Vite passou a responder 500 em tudo.

  O ioredis reconecta sozinho; o que faltava era alguém dizendo que sabe do
  problema. Logar e seguir é o comportamento certo: perder o Redis degrada
  presença e limites de vazão, não justifica derrubar o chat.
*/
export function vigiar(cliente: Redis, nome: string) {
  cliente.on("error", (erro) => console.error(`[redis:${nome}]`, erro.message));
  return cliente;
}

vigiar(redis, "principal");

export const keys = {
  voiceState: (userId: string) => `voice:user:${userId}`,
  voiceChannel: (channelId: string) => `voice:channel:${channelId}`,
  presence: (userId: string) => `presence:${userId}`,
  sessions: (userId: string) => `sessions:${userId}`,
  idle: (userId: string) => `idle:${userId}`,
  typing: (channelId: string, userId: string) => `typing:${channelId}:${userId}`,
  webhookRate: (webhookId: string) => `webhook:rate:${webhookId}`,
  slowmode: (channelId: string, userId: string) => `slow:${channelId}:${userId}`,
  /// bytes enviados ao R2 por esta pessoa na hora corrente
  cotaDeUpload: (userId: string) => `upload:bytes:${userId}`,
  /// mensagens enviadas por esta pessoa na janela curta anti-rajada
  fluxoDeMensagens: (userId: string) => `fluxo:msg:${userId}`,
  desktopLogin: (codigo: string) => `desktop-login:${codigo}`,
  /// OAuth2 das aplicações: o código de uso único e o token que ele vira.
  oauthCode: (codigo: string) => `oauth:code:${codigo}`,
  oauthToken: (token: string) => `oauth:token:${token}`,
  /*
    Quais tokens de OAuth existem por pessoa.

    O token é a CHAVE (`oauth:token:<token>`), e chave não se pergunta pelo
    conteúdo: sem este conjunto não havia como responder "quais aplicações têm
    acesso à minha conta" sem varrer o Redis inteiro. Ele é índice, não fonte —
    quem manda continua sendo a chave do token, que expira sozinha.
  */
  oauthDaPessoa: (userId: string) => `oauth:usuario:${userId}`,
} as const;
