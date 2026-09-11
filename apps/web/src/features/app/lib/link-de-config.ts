import type { Section } from "~/features/configuracoes/components/secoes";

const PARAMETER = "config";

export function sectionLink(section: Section, sub?: string): string {
  const url = new URL(window.location.href);

  url.search = "";
  url.hash = sub ? `#${sub}` : "";
  url.searchParams.set(PARAMETER, section);

  return url.toString();
}

export interface UrlRequest {
  section: Section;
  sub: string | null;
}

export function readUrlRequest(): UrlRequest | null {
  const url = new URL(window.location.href);
  const section = url.searchParams.get(PARAMETER);
  if (!section) return null;

  return { section: section as Section, sub: url.hash.replace(/^#/, "") || null };
}

export function clearUrlRequest(): void {
  const url = new URL(window.location.href);

  url.searchParams.delete(PARAMETER);
  url.hash = "";

  window.history.replaceState(null, "", url.toString());
}
