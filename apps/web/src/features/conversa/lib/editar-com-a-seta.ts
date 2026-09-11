
export interface CandidateEdit {
  id: string;
  author: { id: string };
  kind?: string;
  pending?: boolean;
  failed?: boolean;
}

export function messageForEdit({
  draft,
  euAm,
  messages,
}: {
  draft: string;
  euAm: string | undefined;
  messages: CandidateEdit[];
}): string | null {
  if (draft.length > 0) return null;

  if (!euAm) return null;

  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (!m || m.author.id !== euAm) continue;

    if (m.kind && m.kind !== "USER") continue;
    if (m.pending || m.failed) continue;

    return m.id;
  }

  return null;
}
