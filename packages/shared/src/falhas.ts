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

export const adiantaInsistir = (motivo: MotivoDeFalha) => ADIANTA_INSISTIR.includes(motivo);

export const ehMotivoDeFalha = (valor: unknown): valor is MotivoDeFalha =>
  MOTIVOS_DE_FALHA.includes(valor as MotivoDeFalha);
