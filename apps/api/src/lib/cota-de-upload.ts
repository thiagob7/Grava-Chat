
export const COTA_POR_HORA = 500 * 1024 * 1024;

export const JANELA_DA_COTA_S = 3600;

export interface PedidoDeEnvio {
  jaUsado: number;
  tamanho: number;
  cota?: number;
}

export function cabeNaCota({ jaUsado, tamanho, cota = COTA_POR_HORA }: PedidoDeEnvio): boolean {
  return jaUsado + tamanho <= cota;
}

const mb = (bytes: number) => Math.round(bytes / 1024 / 1024);

export function mensagemDeCota({ jaUsado, cota = COTA_POR_HORA }: Omit<PedidoDeEnvio, "tamanho">) {
  const restante = Math.max(0, cota - jaUsado);

  return `Você atingiu o limite de ${mb(cota)} MB de envio por hora (restam ${mb(restante)} MB). Tente de novo mais tarde.`;
}
