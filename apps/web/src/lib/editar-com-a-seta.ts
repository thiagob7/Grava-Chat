/**
 * Qual mensagem a seta pra cima abre para editar.
 *
 * O atalho existe porque corrigir um erro de digitação não deveria custar
 * tirar a mão do teclado, achar a mensagem, passar o mouse e clicar no lápis.
 * É o gesto que todo mundo já traz do Discord e do terminal.
 *
 * A regra tem três recusas, e cada uma evita um jeito de o atalho atrapalhar
 * em vez de ajudar.
 */
export interface CandidataAEdicao {
  id: string;
  /// o modelo da mensagem traz o autor aninhado, não um `authorId` solto
  author: { id: string };
  /// `USER` é a mensagem escrita por alguém; o resto é do sistema
  tipo?: string;
  /// ainda subindo, ou falhou ao enviar
  pending?: boolean;
  failed?: boolean;
}

export function mensagemParaEditar({
  rascunho,
  euSou,
  mensagens,
}: {
  /// o que está escrito no campo agora
  rascunho: string;
  euSou: string | undefined;
  /// as mensagens do canal, da mais antiga para a mais recente
  mensagens: CandidataAEdicao[];
}): string | null {
  /*
    Campo com texto: a seta é do cursor, não nossa.

    Roubar a seta com o campo preenchido quebraria o gesto mais básico de
    edição de texto — subir uma linha num rascunho de vários parágrafos.
  */
  if (rascunho.length > 0) return null;

  if (!euSou) return null;

  /*
    Percorre de trás pra frente: a intenção é "a última que eu mandei", e não
    "a última do canal". Numa conversa movimentada, a sua costuma estar
    algumas linhas acima.
  */
  for (let i = mensagens.length - 1; i >= 0; i--) {
    const m = mensagens[i];
    if (!m || m.author.id !== euSou) continue;

    /*
      Mensagem do sistema (entrada no servidor, chamada) não se edita: o texto
      não foi escrito, foi gerado. E a que ainda está subindo não tem id no
      servidor pra editar.
    */
    if (m.tipo && m.tipo !== "USER") continue;
    if (m.pending || m.failed) continue;

    return m.id;
  }

  return null;
}
