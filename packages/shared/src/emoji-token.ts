const TOKEN = "<(a?):([a-zA-Z0-9_]{2,32}):([a-f\\d]{24})>";

export const customEmojiPattern = () => new RegExp(TOKEN, "g");

export interface CustomEmojiRef {
  id: string;
  name: string;
  animated: boolean;
}

export const customEmojiToken = (emoji: CustomEmojiRef) => `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`;

export function parseCustomEmoji(text: string): CustomEmojiRef | null {
  const match = new RegExp(`^${TOKEN}$`).exec(text);
  return match ? { animated: match[1] === "a", name: match[2]!, id: match[3]! } : null;
}

export function customEmojiIds(text: string): string[] {
  return [...new Set([...text.matchAll(customEmojiPattern())].map((m) => m[3]!))];
}
