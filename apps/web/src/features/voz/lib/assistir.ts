
export interface EscolhaDeAlvo {
  atual: string | null;
  alvoAindaTransmite: boolean;
}

export function proximoAlvo({ atual, alvoAindaTransmite }: EscolhaDeAlvo): string | null {
  if (atual && alvoAindaTransmite) return atual;

  return null;
}
