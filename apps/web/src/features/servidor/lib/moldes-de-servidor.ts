
export interface ServerMold {
  id: string;
  name: string;
  emoji: string;
  nameSuggestion: string;
  channels: { name: string; kind: "TEXT" | "VOICE" }[];
}

export const MOLDS: ServerMold[] = [
  {
    id: "jogos",
    name: "Jogos",
    emoji: "🎮",
    nameSuggestion: "Squad",
    channels: [
      { name: "combinar-jogo", kind: "TEXT" },
      { name: "clipes", kind: "TEXT" },
      { name: "Sala 2", kind: "VOICE" },
    ],
  },
  {
    id: "amigos",
    name: "Amigos",
    emoji: "💜",
    nameSuggestion: "A turma",
    channels: [
      { name: "figurinhas", kind: "TEXT" },
      { name: "rolês", kind: "TEXT" },
    ],
  },
  {
    id: "estudos",
    name: "Grupo de estudos",
    emoji: "📚",
    nameSuggestion: "Grupo de estudos",
    channels: [
      { name: "materiais", kind: "TEXT" },
      { name: "dúvidas", kind: "TEXT" },
      { name: "Sala de estudo", kind: "VOICE" },
    ],
  },
  {
    id: "criadores",
    name: "Artistas e criadores",
    emoji: "🎨",
    nameSuggestion: "Ateliê",
    channels: [
      { name: "trabalhos", kind: "TEXT" },
      { name: "feedback", kind: "TEXT" },
    ],
  },
];

export function inviteCode(entry: string): string | null {
  const clean = entry.trim();
  if (!clean) return null;

  const last = clean.split(/[/\\]/).filter(Boolean).pop() ?? "";

  const code = last.split(/[?#]/)[0]?.trim() ?? "";

  return code.length ? code : null;
}
