export interface Ancora {
  id: string;
  topo: number;
}

export interface Leitura {
  ancoras: Ancora[];
  linha: number;
  rolagemTotal: number;
}

export function subSecaoAtiva({ ancoras, linha, rolagemTotal }: Leitura): string | null {
  const primeira = ancoras[0]?.id ?? null;
  if (!ancoras.length) return null;

  if (rolagemTotal <= 8) return primeira;

  let atual: string | null = null;
  for (const ancora of ancoras) {
    if (ancora.topo <= linha) atual = ancora.id;
  }

  return atual ?? primeira;
}
