import Redis from "ioredis";
import { env } from "~/env.js";

/*
  O cliente desiste em vez de pendurar a requisição.

  Com `maxRetriesPerRequest: null` — que era o que estava aqui — um comando
  espera o Redis voltar por tempo indefinido. Numa oscilação de trinta segundos
  isso não vira erro: vira requisição HTTP pendurada, segurando conexão e
  memória, e quem está do outro lado só vê a tela parada. Num pico, milhares
  dessas derrubam a API por esgotamento, não por culpa do Redis.

  Errar rápido é melhor: o pedido morre, a conexão é devolvida, e a tela mostra
  que algo falhou em vez de fingir que está carregando.

  A espera entre tentativas cresce, mas com teto, para não virar rajada contra
  um Redis que está justamente tentando levantar.
*/
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  commandTimeout: 5_000,
  retryStrategy: (attempts) => Math.min(attempts * 200, 3_000),
});

export function watch(client: Redis, name: string) {
  client.on("error", (error) => console.error(`[redis:${name}]`, error.message));
  return client;
}

watch(redis, "principal");

export const keys = {
  /*
    O índice de quem está em chamada AGORA.

    Sem ele, descobrir isso pedia `KEYS voice:user:*`, e o `KEYS` não pula nas
    chaves que casam: ele percorre o espaço inteiro e filtra uma por uma. Como o
    Redis atende um comando de cada vez, a varredura para tudo enquanto roda —
    medido aqui, 64ms com um milhão de chaves. Ler um conjunto custa 0,04ms e
    não muda com o tamanho do Redis.
  */
  voicePeople: "voice:pessoas",
  /* Só para a migração: o status escolhido morava aqui antes de ir para o Mongo. */
  legacyPresence: (userId: string) => `presence:${userId}`,
  voiceState: (userId: string) => `voice:user:${userId}`,
  voiceChannel: (channelId: string) => `voice:channel:${channelId}`,
  sessions: (userId: string) => `sessions:${userId}`,
  idle: (userId: string) => `idle:${userId}`,
  webhookRate: (webhookId: string) => `webhook:rate:${webhookId}`,
  slowmode: (channelId: string, userId: string) => `slow:${channelId}:${userId}`,
  uploadQuota: (userId: string) => `upload:bytes:${userId}`,
  messagesFlow: (userId: string) => `fluxo:msg:${userId}`,
  /*
    O recibo de uma mensagem já enviada, por autor e por `nonce`.

    É o que impede a fila de envio de duplicar. Quando a rede cai no meio do
    caminho, o aplicativo não sabe se a mensagem chegou: ele reenvia. Sem
    recibo, o servidor cria a segunda. Com recibo, ele reconhece o `nonce` e
    devolve a que já existe.

    Vale por pouco tempo de propósito. A fila reenvia em segundos ou minutos,
    não em dias, e guardar recibo para sempre seria um custo eterno para um
    problema de instantes.
  */
  sendReceipt: (userId: string, nonce: string) => `envio:recibo:${userId}:${nonce}`,
  desktopLogin: (code: string) => `desktop-login:${code}`,
  oauthCode: (code: string) => `oauth:code:${code}`,
  oauthToken: (token: string) => `oauth:token:${token}`,
  personOauth: (userId: string) => `oauth:usuario:${userId}`,
  passwordReset: (token: string) => `senha:redefinir:${token}`,
  resetRequest: (userId: string) => `senha:pedido:${userId}`,
  emailVerification: (token: string) => `email:verificar:${token}`,
  officialNotice: (key: string) => `oficial:aviso:${key}`,
  verificationRequest: (userId: string) => `email:pedido:${userId}`,
} as const;
