/**
 * As duas pontas de uma chamada no privado: quem toca e quem chama.
 *
 * O evento que carrega tudo isso é o mesmo `voice:joined` de sempre — não
 * existe um "início de chamada" no servidor. Ligar é entrar na sala de voz do
 * canal da conversa; o que transforma isso em telefone tocando é a leitura
 * que se faz do evento aqui.
 *
 * Ele chega pelas salas de usuário dos dois participantes (ver
 * `destinatariosDaVoz` no servidor), então alcança quem está com a conversa
 * fechada — que é justamente quando o aviso importa. O preço é que o seu
 * PRÓPRIO join também volta pra você, daí a checagem de quem entrou.
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

/**
 * O outro lado: quando VOCÊ está chamando e ainda ninguém atendeu.
 *
 * Estar sozinho na sala de um privado é o mesmo que o telefone tocando do lado
 * de lá. Num canal de servidor, estar sozinho é só estar sozinho — gente entra
 * e sai o dia todo e ninguém está esperando ninguém.
 */
export function estaChamando({
  guildId,
  quantosNaSala,
}: {
  guildId: string | null;
  /// quantas pessoas o SFU reporta na sala, você inclusive
  quantosNaSala: number;
}): boolean {
  return guildId === null && quantosNaSala <= 1;
}
