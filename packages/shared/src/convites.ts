import { houseAddress } from "./origens.js";

export const INVITE_PATH = "/invite/";

export function inviteLinkCode(
  url: string,
  origin: string | readonly string[],
): string | null {
  const address = houseAddress(url, origin);
  if (!address) return null;

  const found = new RegExp(
    `^${INVITE_PATH}([A-Za-z0-9_-]{4,32})$`,
  ).exec(address.pathname);

  return found?.[1] ?? null;
}
