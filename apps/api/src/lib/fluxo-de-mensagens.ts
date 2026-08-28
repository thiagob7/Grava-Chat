/**
 * Quantas mensagens uma pessoa pode mandar num intervalo curto.
 *
 * Não é o modo lento, e os dois têm donos diferentes: o modo lento é uma
 * decisão de MODERAÇÃO, por canal, desligada por padrão, e existe pra dar ritmo
 * à conversa. Este teto é do SISTEMA, vale sempre e em todo canal, e existe pra
 * que um cliente em laço — ou alguém decidido a atrapalhar — não despeje
 * mensagem mais rápido do que qualquer pessoa consegue ler.
 *
 * Mora aqui, e não num limite de rota HTTP, porque mensagem neste app não passa
 * por HTTP: ela é enviada pelo Socket.IO (`message:send`). Um limite de rota
 * não encostaria nela.
 *
 * O número é generoso de propósito. Quem digita manda uma mensagem a cada dois
 * ou três segundos; dez em dez segundos é o triplo disso, e ainda derruba a
 * rajada — que é a única coisa que se quer barrar.
 */
export const LIMITE_POR_JANELA = 10;

export const JANELA_S = 10;

/**
 * `usos` é o valor que o `INCR` devolveu, ou seja, já inclui a mensagem atual.
 * Por isso a comparação é `>` e não `>=`: na décima mensagem `usos` vale 10, e
 * ela ainda passa.
 */
export function passouDoFluxo(usos: number, limite = LIMITE_POR_JANELA): boolean {
  return usos > limite;
}

export function mensagemDeFluxo(segundosRestantes: number): string {
  /// Dizer quantos segundos faltam é o que separa "espera um pouco" de um erro
  /// que a pessoa não sabe se vai passar.
  return `Você está mandando mensagem rápido demais. Espere ${Math.max(segundosRestantes, 1)}s.`;
}
