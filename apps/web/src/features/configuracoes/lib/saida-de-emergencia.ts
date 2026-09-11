export const OUTPUT_KEY = "sem-tema";

export function themeOffByUrl(): boolean {
  if (typeof window === "undefined") return false;

  return new URLSearchParams(window.location.search).has(OUTPUT_KEY);
}

export function outputAddress(): string {
  const address = new URL(window.location.href);
  address.searchParams.set(OUTPUT_KEY, "");

  return address.toString();
}
