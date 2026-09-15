export interface MentionLabel {
  label: string;
  token: string;
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function mentionPattern(labels: string[]): RegExp | null {
  const unique = [...new Set(labels)].filter(Boolean).sort((a, b) => b.length - a.length);
  if (!unique.length) return null;

  return new RegExp(`(${unique.map(escape).join("|")})(?![\\p{L}\\p{N}_])`, "gu");
}

export function withMentionTokens(text: string, labels: MentionLabel[]): string {
  const pattern = mentionPattern(labels.map((m) => m.label));
  if (!pattern) return text;

  const byLabel = new Map(labels.map((m) => [m.label, m.token]));
  return text.replace(pattern, (label) => byLabel.get(label) ?? label);
}
