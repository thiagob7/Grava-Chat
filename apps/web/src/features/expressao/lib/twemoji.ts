

const VARIATION_PICKER = /\uFE0F/g;
const ZWJ = "\u200D";

export function codepointDoEmoji(emoji: string): string {
  const text = emoji.includes(ZWJ) ? emoji : emoji.replace(VARIATION_PICKER, "");

  return [...text]
    .map((character) => character.codePointAt(0)!.toString(16))
    .join("-");
}

export const urlDoEmoji = (emoji: string) => `/emoji/${codepointDoEmoji(emoji)}.svg`;

export const EMOJI =
  /(?:\p{Regional_Indicator}\p{Regional_Indicator}|(?:\p{Extended_Pictographic}|[0-9#*]\uFE0F?\u20E3)(?:\p{Emoji_Modifier}|\uFE0F)?(?:\u200D(?:\p{Extended_Pictographic}|\p{Regional_Indicator}\p{Regional_Indicator})(?:\p{Emoji_Modifier}|\uFE0F)?)*)/gu;
