import type { FastifyRequest } from "fastify";
import type { RateLimitOptions } from "@fastify/rate-limit";

/*
  Só a política, sem store e sem `env`. Mora aqui pelo mesmo motivo do
  `retomada.ts`: o `env.ts` chama `process.exit(1)` quando falta variável, então
  qualquer teste que importasse isto pelo plugin morreria antes da primeira
  asserção — o processo inteiro cai, não o teste. Separado, a regra é testável
  com um `vitest` seco, sem `.env` e sem Redis no ar.
*/
/*
  Teto bruto por IP, e de propósito generoso: este plugin não existe pra afinar
  o uso normal, existe pra que um laço `while (true)` na banda de alguém não
  consuma a máquina inteira. A API roda num Oracle Micro com 1/8 de núcleo
  dividido com o Redis e o bot de música — aqui não sobra folga pra absorver
  abuso, e o limite fino vive rota a rota (`config.rateLimit`), não aqui.

  Uma carga de tela cheia dispara algo entre 30 e 50 chamadas; 300/min aguenta
  isso várias vezes e ainda cobre uma casa inteira atrás do mesmo NAT.
*/
const TETO_POR_MINUTO = 300;

/*
  A política vive separada do store porque é ela que tem decisão dentro — os
  números, quem escapa, o formato do erro. Assim o teste registra as mesmas
  regras com o contador em memória e verifica o comportamento de verdade, sem
  precisar de um Redis no ar pra rodar.
*/
export const politicaDeVazao = {
  max: TETO_POR_MINUTO,
  timeWindow: "1 minute",

  /*
    Perder o Redis não pode derrubar o chat — é a mesma decisão que está
    escrita no `lib/redis.ts`. Com `skipOnError`, se o store falhar a
    requisição PASSA. Fica sem proteção por alguns segundos, o que é
    infinitamente melhor que 429 em todo mundo porque o Redis piscou.
  */
  skipOnError: true,

  /*
    O health é sondado de fora em intervalo curto (monitoramento, e o Caddy na
    frente). Contar essas batidas gastaria o teto do IP do próprio monitorador
    e, no pior caso, faria a sonda reportar a API como morta quando ela está
    apenas ocupada.
  */
  allowList: (req: FastifyRequest) => req.url === "/api/health",

  /*
    `trustProxy` está ligado no `app.ts`, então `req.ip` já é o IP real do
    cliente vindo do X-Forwarded-For, e não o do Caddy — sem isso o mundo
    inteiro dividiria um balde só.
  */
  keyGenerator: (req: FastifyRequest) => req.ip,

  /*
    O objeto volta pelo `setErrorHandler` do `app.ts`, que responde `{ message }`
    pra tudo abaixo de 500. Manter esse formato importa: o front lê `message` pra
    montar o toast, e uma resposta fora do padrão apareceria como erro genérico.
  */
  errorResponseBuilder: (_req: FastifyRequest, ctx: { ttl: number }) => ({
    statusCode: 429,
    message: `Calma aí — muitas requisições seguidas. Tente de novo em ${Math.ceil(ctx.ttl / 1000)}s.`,
  }),
} satisfies RateLimitOptions;
