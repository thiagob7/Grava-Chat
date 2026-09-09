export interface TemaDaGaleria {
  id: string;
  nome: string;
  descricao: string | null;
  autor: string | null;
  versao: string | null;
  tags: string[];
  substituicoes: Record<string, string>;
  publicadoPor: { id: string; displayName: string; avatarUrl: string | null };
  createdAt: string;
}

export interface AplicativoDescoberto {
  id: string;
  nome: string;
  avatarUrl: string | null;
  descricao: string | null;
  permissoesPedidas: string[];
  comandos: number;
  dono: { id: string; displayName: string };
  createdAt: string;
}

export const CORES_DA_PREVIA = [
  "--color-brand",
  "--background-primary",
  "--background-secondary",
  "--text-primary",
] as const;
