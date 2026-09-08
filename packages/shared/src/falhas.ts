/*
  Por que uma mensagem não foi entregue.

  O aviso é do CLIENTE, não mensagem guardada: nada disso chega ao banco nem
  a quem ia receber. O servidor manda o código junto da recusa para a tela
  poder dizer o motivo — e, com ele, decidir se oferece tentar de novo, que
  em castigo ou AutoMod só faria a pessoa bater na mesma parede.
*/
export const MOTIVOS_DE_FALHA = [
  "sem-conexao",
  "sem-acesso",
  "sem-permissao",
  "castigo",
  "modo-lento",
  "depressa",
  "automod",
  "recusada",
  "erro",
] as const;

export type MotivoDeFalha = (typeof MOTIVOS_DE_FALHA)[number];

const ADIANTA_INSISTIR: readonly MotivoDeFalha[] = ["sem-conexao", "modo-lento", "depressa", "erro"];

/// Se vale oferecer o "tentar de novo": só onde a espera muda o resultado.
export const adiantaInsistir = (motivo: MotivoDeFalha) => ADIANTA_INSISTIR.includes(motivo);

export const ehMotivoDeFalha = (valor: unknown): valor is MotivoDeFalha =>
  MOTIVOS_DE_FALHA.includes(valor as MotivoDeFalha);
