export type Trigger = "WORDS" | "MENTION_SPAM" | "LINKS";

export interface ContentRule {
  trigger: Trigger;
  words: string[];
  limitMentions: number | null;
}

export const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const ESCAPE = /[.*+?^${}()|[\]\\]/g;
const LINK = /\bhttps?:\/\/\S+|\bwww\.\S+\.\S+/i;

function countMentions(content: string) {
  const users = content.match(/<@[a-f\d]{24}>/gi)?.length ?? 0;
  const roleList = content.match(/<@&[a-f\d]{24}>/gi)?.length ?? 0;
  const all = content.match(/@(everyone|here)\b/gi)?.length ?? 0;

  return users + roleList + all;
}

export function violation(content: string, rule: ContentRule): string | null {
  if (rule.trigger === "LINKS") {
    return LINK.test(content) ? "link" : null;
  }

  if (rule.trigger === "MENTION_SPAM") {
    const limit = rule.limitMentions ?? 5;
    return countMentions(content) >= limit ? "menções demais" : null;
  }

  const text = normalize(content);

  for (const word of rule.words) {
    const target = normalize(word).trim();
    if (!target) continue;

    const fallback = new RegExp(`(^|[^\\p{L}\\p{N}])${target.replace(ESCAPE, "\\$&")}([^\\p{L}\\p{N}]|$)`, "u");
    if (fallback.test(text)) return `palavra bloqueada: ${word}`;
  }

  return null;
}
