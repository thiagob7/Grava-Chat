
export interface ChamadaRecebida {
  guildId: string | null;
  channelId: string;
  quemEntrou: string;
  euSou: string;
  meuCanalDeVoz: string | null;
}

export function deveTocar({
  guildId,
  channelId,
  quemEntrou,
  euSou,
  meuCanalDeVoz,
}: ChamadaRecebida): boolean {
  if (guildId !== null) return false;

  if (quemEntrou === euSou) return false;

  if (meuCanalDeVoz === channelId) return false;

  return true;
}

export function estaChamando({
  guildId,
  quantosNaSala,
}: {
  guildId: string | null;
  quantosNaSala: number;
}): boolean {
  return guildId === null && quantosNaSala <= 1;
}
