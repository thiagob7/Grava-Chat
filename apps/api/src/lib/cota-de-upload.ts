/**
 * Quanto uma pessoa pode enviar ao armazenamento por hora.
 *
 * O limite por requisição (`@fastify/rate-limit`) conta CHAMADAS, e chamada não
 * é a unidade que custa: sessenta fotos comprimidas dão uns 30 MB, sessenta
 * vídeos de 50 MB dão 3 GB. Os dois passam pelo mesmo teto de requisição e só
 * um deles é problema.
 *
 * O que se protege aqui é o bucket. O plano gratuito do R2 são 10 GB, e eles
 * são DIVIDIDOS com o outro produto que usa o mesmo bucket — não há 10 GB só
 * pra este chat. Sem cota, uma pessoa sozinha enche tudo antes de alguém notar.
 *
 * A cota é uma trava de VELOCIDADE, não de total: ela impede o arranco, não o
 * acúmulo. Contra o acúmulo o que vale é apagar o anexo junto com a mensagem,
 * que é o que `uploadService.remover` faz.
 */
export const COTA_POR_HORA = 500 * 1024 * 1024;

export const JANELA_DA_COTA_S = 3600;

export interface PedidoDeEnvio {
  /// bytes que esta pessoa já enviou na janela corrente
  jaUsado: number;
  /// tamanho do arquivo que ela quer enviar agora
  tamanho: number;
  cota?: number;
}

export function cabeNaCota({ jaUsado, tamanho, cota = COTA_POR_HORA }: PedidoDeEnvio): boolean {
  return jaUsado + tamanho <= cota;
}

const mb = (bytes: number) => Math.round(bytes / 1024 / 1024);

export function mensagemDeCota({ jaUsado, cota = COTA_POR_HORA }: Omit<PedidoDeEnvio, "tamanho">) {
  /*
    A mensagem diz o QUE aconteceu e QUANTO falta, porque "limite excedido"
    sozinho não deixa ninguém decidir nada — nem esperar, nem mandar menor.
  */
  const restante = Math.max(0, cota - jaUsado);

  return `Você atingiu o limite de ${mb(cota)} MB de envio por hora (restam ${mb(restante)} MB). Tente de novo mais tarde.`;
}
