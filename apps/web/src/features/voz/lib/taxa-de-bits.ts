/*
  A taxa de bits do microfone, como o canal pediu.

  Quem escolhe é o dono do canal, na tela de configuração. Aqui só se garante
  que o número que chegou serve: veio da rede, e número da rede não se usa cru
  numa chamada de mídia.

  Os limites são os mesmos que a API aceita ao salvar. O piso de 8 kbps é o
  mínimo em que o Opus ainda entrega fala inteligível; o teto de 96 kbps é
  onde a qualidade para de melhorar para voz e só sobra conta de banda.
*/
export const BITRATE_FLOOR = 8_000;
export const BITRATE_CEILING = 96_000;
export const BITRATE_FALLBACK = 64_000;

export function audioBitrate(asked: number | undefined): number {
  if (typeof asked !== "number" || !Number.isFinite(asked)) return BITRATE_FALLBACK;

  return Math.min(Math.max(Math.round(asked), BITRATE_FLOOR), BITRATE_CEILING);
}
