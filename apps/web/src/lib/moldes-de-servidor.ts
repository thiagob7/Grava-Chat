
export interface MoldeDeServidor {
  id: string;
  nome: string;
  emoji: string;
  sugestaoDeNome: string;
  canais: { nome: string; tipo: "TEXT" | "VOICE" }[];
}

export const MOLDES: MoldeDeServidor[] = [
  {
    id: "jogos",
    nome: "Jogos",
    emoji: "🎮",
    sugestaoDeNome: "Squad",
    canais: [
      { nome: "combinar-jogo", tipo: "TEXT" },
      { nome: "clipes", tipo: "TEXT" },
      { nome: "Sala 2", tipo: "VOICE" },
    ],
  },
  {
    id: "amigos",
    nome: "Amigos",
    emoji: "💜",
    sugestaoDeNome: "A turma",
    canais: [
      { nome: "figurinhas", tipo: "TEXT" },
      { nome: "rolês", tipo: "TEXT" },
    ],
  },
  {
    id: "estudos",
    nome: "Grupo de estudos",
    emoji: "📚",
    sugestaoDeNome: "Grupo de estudos",
    canais: [
      { nome: "materiais", tipo: "TEXT" },
      { nome: "dúvidas", tipo: "TEXT" },
      { nome: "Sala de estudo", tipo: "VOICE" },
    ],
  },
  {
    id: "criadores",
    nome: "Artistas e criadores",
    emoji: "🎨",
    sugestaoDeNome: "Ateliê",
    canais: [
      { nome: "trabalhos", tipo: "TEXT" },
      { nome: "feedback", tipo: "TEXT" },
    ],
  },
];

export function codigoDoConvite(entrada: string): string | null {
  const limpo = entrada.trim();
  if (!limpo) return null;

  const ultimo = limpo.split(/[/\\]/).filter(Boolean).pop() ?? "";

  const codigo = ultimo.split(/[?#]/)[0]?.trim() ?? "";

  return codigo.length ? codigo : null;
}
