
export type Qualidade = "excellent" | "good" | "poor" | "lost" | "unknown" | string;

export interface AvisoDeQualidade {
  rotulo: string;
  cor: string;
  pulsando: boolean;
}

export function avisoDeQualidade(qualidade: Qualidade): AvisoDeQualidade | null {
  if (qualidade === "poor") {
    return { rotulo: "Conexão instável", cor: "text-idle", pulsando: false };
  }

  if (qualidade === "lost") {
    return { rotulo: "Conexão perdida", cor: "text-danger", pulsando: true };
  }

  return null;
}
