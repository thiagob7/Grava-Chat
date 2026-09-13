import { helpsInsist, isFailureReason, type FailureReason } from "@gravae/shared";

/*
  Quando vale guardar a mensagem para tentar de novo, e quando é melhor falhar
  na cara da pessoa.

  A pergunta não é "deu erro?", é "isso vai mudar sozinho?". Rede caída muda:
  daqui a pouco volta e a mensagem sai. Mas "você não tem permissão para falar
  neste canal" não muda por esperar — enfileirar isso seria enganar quem
  escreveu, que ficaria olhando um relógio que nunca vira tique.

  A lista de motivos que ajudam a insistir já existe e é compartilhada com o
  botão de tentar de novo, então os dois caminhos concordam por construção.
*/
export function worthQueueing(reason: FailureReason | undefined): boolean {
  if (!reason || !isFailureReason(reason)) return false;

  /*
    "erro" ajuda a pessoa a apertar "tentar de novo", mas não entra na fila: é
    o motivo de quem não tem motivo — payload recusado, falha inesperada — e
    guardado ele voltava a falhar a cada volta, segurando quem vinha atrás.
  */
  if (reason === "erro") return false;

  return helpsInsist(reason);
}

/*
  Só a falta de rede para a fila inteira: se uma não saiu por isso, as outras
  também não sairiam. Modo lento e limite de fluxo são de um canal, então
  seguram só as mensagens daquele canal, para não embaralhar a ordem dele.
*/
export const stopsWholeQueue = (reason: FailureReason) => reason === "sem-conexao";

/*
  Espera crescente entre uma tentativa e a próxima, com teto.

  Sem isso, uma fila com trinta mensagens vira trinta pedidos no instante em que
  o Wi-Fi pisca — e como ele costuma piscar de novo logo, viram trinta falhas e
  a fila inteira caminha para o teto de tentativas de uma vez.

  Os degraus são em segundos: 1, 2, 4, 8, 16, 30, 30, 30…
*/
export function waitBeforeTry(tries: number, ceilingMs = 30_000): number {
  if (tries <= 0) return 0;

  return Math.min(2 ** (tries - 1) * 1_000, ceilingMs);
}
