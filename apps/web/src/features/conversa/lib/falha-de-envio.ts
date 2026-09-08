import { adiantaInsistir, ehMotivoDeFalha, type MotivoDeFalha } from "@gravae/shared";

/*
  O aviso de "não foi entregue".

  Ele é só daqui: nada foi guardado, e quem ia receber não fica sabendo de
  nada. O que muda por motivo é o texto e a oferta de tentar de novo — em
  castigo, sem permissão ou AutoMod, insistir só bate na mesma parede.

  Motivo que não reconhecemos vira "erro", que é o texto genérico com o botão:
  é o que a tela fazia antes de existirem motivos, e errar para o lado de
  deixar tentar é melhor do que travar quem só perdeu um pacote.
*/
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
