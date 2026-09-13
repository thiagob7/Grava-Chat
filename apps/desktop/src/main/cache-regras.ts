/*
  As decisões do cache local, separadas do SQLite para poderem ser testadas sem
  abrir banco nenhum.
*/

/** Noventa dias. Conversa mais velha que isso ninguém rola para ver. */
export const KEEP_DAYS = 90;

/** Teto por conta. Cache sem teto é disco cheio. */
export const KEEP_MESSAGES = 40_000;

/** O que a conversa mostra de primeira ao abrir. */
export const PAGE_DEFAULT = 50;
export const PAGE_CEILING = 200;

/*
  O nome do arquivo vem de um id que chegou da janela, e a janela é código que
  roda na internet. Sem conferir, um id com `../` escreveria banco fora da
  pasta do aplicativo. Id do Mongo é sempre 24 dígitos hexadecimais — o que não
  for isso não vira arquivo.
*/
export function accountFile(accountId: string): string | null {
  return /^[0-9a-f]{24}$/i.test(accountId) ? `${accountId.toLowerCase()}.db` : null;
}

/** Em que instante a poda corta, dado o relógio de agora. */
export function cutOff(now: number, days = KEEP_DAYS): number {
  return now - days * 24 * 60 * 60 * 1000;
}

export function pageSize(asked: number | undefined): number {
  if (!asked || !Number.isFinite(asked)) return PAGE_DEFAULT;
  return Math.min(Math.max(Math.trunc(asked), 1), PAGE_CEILING);
}

/*
  O que sai daqui vai para uma coluna INTEGER, e ordenar conversa por texto de
  data põe as mensagens fora de ordem. Data que não dá para ler vira zero, que
  manda a mensagem para o fim da fila da poda em vez de derrubar a escrita.
*/
export function whenIn(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/*
  Quantas vezes vale insistir numa mensagem antes de desistir.

  Não é para nunca desistir. Mensagem que falha dez vezes seguidas não está
  esbarrando em rede ruim: está esbarrando em alguma coisa que não vai mudar
  sozinha — canal apagado, acesso retirado, conta banida. Insistir para sempre
  seria queimar bateria e dar esperança falsa a quem escreveu.
*/
export const SEND_TRIES_CEILING = 10;

/* Uma semana. Depois disso a mensagem não faz mais sentido nem para quem escreveu. */
export const QUEUE_KEEP_DAYS = 7;
