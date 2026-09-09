import { adiantaInsistir, ehMotivoDeFalha, type MotivoDeFalha } from "@gravae/shared";

const CHAVES: Record<MotivoDeFalha, string> = {
  "sem-conexao": "conversa.falha.semConexao",
  "sem-acesso": "conversa.falha.semAcesso",
  "sem-permissao": "conversa.falha.semPermissao",
  castigo: "conversa.falha.castigo",
  "modo-lento": "conversa.falha.modoLento",
  depressa: "conversa.falha.depressa",
  automod: "conversa.falha.automod",
  recusada: "conversa.falha.recusada",
  erro: "conversa.falha.erro",
};

export const motivoDaFalha = (erro: unknown): MotivoDeFalha => {
  const motivo = (erro as { motivo?: unknown } | null)?.motivo;

  return ehMotivoDeFalha(motivo) ? motivo : "erro";
};

export const chaveDaFalha = (motivo: MotivoDeFalha | undefined) =>
  CHAVES[motivo && ehMotivoDeFalha(motivo) ? motivo : "erro"];

export const podeTentarDeNovo = (motivo: MotivoDeFalha | undefined) =>
  !motivo || !ehMotivoDeFalha(motivo) ? true : adiantaInsistir(motivo);
