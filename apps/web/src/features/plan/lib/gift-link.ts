import { cleanGiftCode, GIFT_CODE_SIZE } from "@gravae/shared";

export function giftCodeInLink(text: string): string | null {
  const trimmed = text.trim();
  if (!/^https?:\/\/\S+$/.test(trimmed)) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const fromPath = /^\/gift\/([A-Za-z0-9-]+)\/?$/.exec(url.pathname)?.[1] ?? "";
  const code = cleanGiftCode(url.searchParams.get("gift") || fromPath);

  return code.length === GIFT_CODE_SIZE ? code : null;
}
