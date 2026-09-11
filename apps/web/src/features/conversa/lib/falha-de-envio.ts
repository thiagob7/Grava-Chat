import { helpsInsist, isFailureReason, type FailureReason } from "@gravae/shared";

const KEYS: Record<FailureReason, string> = {
  "sem-conexao": "conversa.falha.semConexao",
  "sem-acesso": "conversa.falha.semAcesso",
  "sem-permissao": "conversa.falha.semPermissao",
  castigo: "conversa.falha.castigo",
  "modo-lento": "conversa.falha.modoLento",
  depressa: "conversa.falha.depressa",
  automod: "conversa.falha.automod",
  recusada: "conversa.falha.recusada",
  "nao-entregue": "conversa.falha.naoEntregue",
  erro: "conversa.falha.erro",
};

export const failureReason = (error: unknown): FailureReason => {
  const reason = (error as { reason?: unknown } | null)?.reason;

  return isFailureReason(reason) ? reason : "erro";
};

export const failureKey = (reason: FailureReason | undefined) =>
  KEYS[reason && isFailureReason(reason) ? reason : "erro"];

export const newCanTry = (reason: FailureReason | undefined) =>
  !reason || !isFailureReason(reason) ? true : helpsInsist(reason);
