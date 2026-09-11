export const FAILURE_REASONS = [
  "sem-conexao",
  "sem-acesso",
  "sem-permissao",
  "castigo",
  "modo-lento",
  "depressa",
  "automod",
  "recusada",
  "nao-entregue",
  "erro",
] as const;

export type FailureReason = (typeof FAILURE_REASONS)[number];

const HELPS_INSIST: readonly FailureReason[] = ["sem-conexao", "modo-lento", "depressa", "erro"];

export const helpsInsist = (reason: FailureReason) => HELPS_INSIST.includes(reason);

export const isFailureReason = (value: unknown): value is FailureReason =>
  FAILURE_REASONS.includes(value as FailureReason);
