/**
 * O que dizer embaixo do nome de alguém na lista de conversas.
 *
 * São dois "está em voz" diferentes, e confundi-los seria mentir para quem lê:
 *
 * - **Em uma chamada** é uma chamada COM VOCÊ, no privado. Você está dentro
 *   dela agora, e o dado vem do próprio `voice-store` — não há nada a
 *   consultar no servidor.
 * - **Em voz** é a pessoa num canal de voz de algum servidor que vocês dois
 *   compartilham. Aí é informação de fora, e vem do `useAtivos`.
 *
 * A distinção não é cosmética: chamada de privado é justamente o que o
 * `ativosAgora` do servidor NÃO devolve, e de propósito — ninguém entra na
 * conversa privada dos outros, então anunciá-la como "entre aqui" seria
 * oferecer uma porta que não existe.
 */
export type TipoDeStatus = "chamada" | "voz";

export interface StatusDaConversa {
  texto: string;
  tipo: TipoDeStatus;
}

export function statusDaConversa({
  emChamadaComigo,
  emVozNoServidor,
}: {
  /// esta conversa é a chamada de privado em que EU estou agora
  emChamadaComigo: boolean;
  /// a pessoa está num canal de voz de um servidor que compartilhamos
  emVozNoServidor: boolean;
}): StatusDaConversa | null {
  /*
    A chamada comigo vence. Se as duas fossem verdade — o que só acontece num
    intervalo de milissegundos, entre entrar num lugar e sair do outro —, o que
    importa pra quem lê é aquela em que ele está envolvido.
  */
  if (emChamadaComigo) return { texto: "Em uma chamada", tipo: "chamada" };
  if (emVozNoServidor) return { texto: "Em voz", tipo: "voz" };

  /// Sem nada acontecendo, a linha não existe — subtítulo vazio em toda
  /// conversa dobraria a altura da lista pra não dizer nada.
  return null;
}
