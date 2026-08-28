/**
 * Quando um `voice:joined` deve TOCAR pra você, em vez de só atualizar a tela.
 *
 * No servidor, alguém entrar num canal de voz é informação de fundo: aparece na
 * barra lateral e ninguém é interrompido. No privado é o contrário — se a outra
 * pessoa entrou na chamada, ela está te ligando, e não avisar é o mesmo que não
 * ter chamada nenhuma.
 *
 * O evento chega pelas salas de usuário dos dois participantes (ver
 * `destinatariosDaVoz` no servidor), então ele chega inclusive pra quem está
 * noutra tela — e é justamente aí que o aviso importa. O preço disso é que o
 * seu PRÓPRIO join também volta pra você, daí a checagem de quem entrou.
 */
export interface ChamadaRecebida {
  /// `null` é o que marca uma chamada de privado
  guildId: string | null;
  /// o canal da conversa onde a chamada está acontecendo
  channelId: string;
  /// quem acabou de entrar na chamada
  quemEntrou: string;
  /// eu
  euSou: string;
  /// em qual canal de voz eu já estou, se estou em algum
  meuCanalDeVoz: string | null;
}

export function deveTocar({
  guildId,
  channelId,
  quemEntrou,
  euSou,
  meuCanalDeVoz,
}: ChamadaRecebida): boolean {
  /// Em servidor, entrar num canal de voz não interrompe ninguém.
  if (guildId !== null) return false;

  /// O próprio join volta pelo mesmo caminho — tocar aqui seria ligar pra si.
  if (quemEntrou === euSou) return false;

  /// Já estamos os dois na mesma chamada: isso é a pessoa chegando, não chamando.
  if (meuCanalDeVoz === channelId) return false;

  return true;
}
