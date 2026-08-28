/**
 * Quem o palco deve mostrar depois de um evento de faixa.
 *
 * Duas versões erradas moraram aqui, e vale registrar as duas.
 *
 * A primeira reescrevia o alvo pra VOCÊ MESMO a cada evento enquanto você
 * estivesse transmitindo. Como isso roda a cada faixa que entra, sai, muta ou
 * desmuta, clicar em "Assistir ao fulano" durava até o próximo evento de
 * qualquer pessoa da sala.
 *
 * A segunda ainda te levava pra dentro da própria transmissão no instante em
 * que ela começava. Parecia atencioso e escondia o que interessa: a grade tem
 * o seu quadro de pessoa E o quadro da sua live, lado a lado, e ser jogado
 * direto na tela cheia da live significava nunca ver essa grade — nem o seu
 * card, nem quem mais está na chamada.
 *
 * A regra final é sem esperteza nenhuma: o palco mostra o que VOCÊ escolheu
 * assistir, e só. Começar a transmitir não muda o que você está vendo.
 */
export interface EscolhaDeAlvo {
  /// quem o palco mostra agora; `null` quando está na grade
  atual: string | null;
  /// o alvo atual continua com uma transmissão no ar
  alvoAindaTransmite: boolean;
}

export function proximoAlvo({ atual, alvoAindaTransmite }: EscolhaDeAlvo): string | null {
  /// A escolha de quem está assistindo vale enquanto houver o que assistir.
  if (atual && alvoAindaTransmite) return atual;

  /// A transmissão acabou (ou nunca houve escolha): volta pra grade.
  return null;
}
