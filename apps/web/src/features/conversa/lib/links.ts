
export const LINK = /https?:\/\/[^\s<]+/g;

export const clearLink = (url: string) => url.replace(/[.,;:!?)\]}]+$/, "");

export const IS_IMAGE = /\.(gif|png|jpe?g|webp|avif)(\?|#|$)/i;

export const SO_UM_LINK = /^https?:\/\/\S+$/;

export function extractLinks(content: string, max = 3): string[] {
  const matches = new Set<string>();

  for (const [raw] of content.matchAll(LINK)) {
    const url = clearLink(raw);

    if (IS_IMAGE.test(url)) continue;

    matches.add(url);
    if (matches.size >= max) break;
  }

  return [...matches];
}
