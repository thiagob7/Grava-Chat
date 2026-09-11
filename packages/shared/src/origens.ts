export const APP_ORIGINS = [
  "https://gravae-chat.vercel.app",
  "https://gravae-chat-staging.vercel.app",
] as const;

function sameOrigin(uma: string, address: URL): boolean {
  try {
    return new URL(uma).origin === address.origin;
  } catch {
    return false;
  }
}

export function houseAddress(
  url: string,
  origin: string | readonly string[],
): URL | null {
  const our = (typeof origin === "string" ? [origin] : [...origin]).filter(
    Boolean,
  );

  const base = our[0];
  if (!base) return null;

  try {
    const address = new URL(url, base);

    return our.some((uma) => sameOrigin(uma, address)) ? address : null;
  } catch {
    return null;
  }
}
