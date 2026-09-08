/*
  As abas do Explorar que não são comunidade.

  Tema e aplicativo chegam mais magros do que o registro completo: a galeria
  mostra cartão, não conteúdo. O CSS inteiro de um tema pesa mais que a
  página toda de cartões, e ninguém precisa dele antes de escolher — quem
  clica busca o tema pelo link, que é o caminho que já existia.
*/
export interface TemaDaGaleria {
  id: string;
  nome: string;
  descricao: string | null;
  autor: string | null;
  versao: string | null;
  tags: string[];
  /// Só os tokens: dá para pintar a prévia do cartão sem carregar a folha.
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

/// Quantas cores da prévia o cartão do tema mostra, na ordem em que couberem.
export const CORES_DA_PREVIA = [
  "--color-brand",
  "--background-primary",
  "--background-secondary",
  "--text-primary",
] as const;
