
export type TipoDeStatus = "chamada" | "voz";

export interface StatusDaConversa {
  texto: string;
  tipo: TipoDeStatus;
}

export function statusDaConversa({
  emChamadaComigo,
  emVozNoServidor,
}: {
  emChamadaComigo: boolean;
  emVozNoServidor: boolean;
}): StatusDaConversa | null {
  if (emChamadaComigo) return { texto: "Em uma chamada", tipo: "chamada" };
  if (emVozNoServidor) return { texto: "Em voz", tipo: "voz" };

  return null;
}
