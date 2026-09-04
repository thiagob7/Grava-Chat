
export interface CandidataAEdicao {
  id: string;
  author: { id: string };
  tipo?: string;
  pending?: boolean;
  failed?: boolean;
}

export function mensagemParaEditar({
  rascunho,
  euSou,
  mensagens,
}: {
  rascunho: string;
  euSou: string | undefined;
  mensagens: CandidataAEdicao[];
}): string | null {
  if (rascunho.length > 0) return null;

  if (!euSou) return null;

  for (let i = mensagens.length - 1; i >= 0; i--) {
    const m = mensagens[i];
    if (!m || m.author.id !== euSou) continue;

    if (m.tipo && m.tipo !== "USER") continue;
    if (m.pending || m.failed) continue;

    return m.id;
  }

  return null;
}
