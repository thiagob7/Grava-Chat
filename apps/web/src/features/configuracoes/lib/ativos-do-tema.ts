const CALL = /gc-ativo\(\s*(["']?)([^"')]+)\1\s*\)/g;

export interface ActiveNamed {
  name: string;
  url: string;
}

const flatten = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, "");

export interface ActiveThemeWith {
  css: string;
  missing: string[];
}

export function resolveActive(
  css: string,
  actives: ActiveNamed[],
): ActiveThemeWith {
  const byName = new Map<string, string>();

  for (const active of actives) {
    byName.set(flatten(active.name), active.url);
    byName.set(active.name.trim().toLowerCase(), active.url);
  }

  const missing = new Set<string>();

  const resolved = css.replace(CALL, (whole, _quotes, request: string) => {
    const url =
      byName.get(request.trim().toLowerCase()) ?? byName.get(flatten(request));

    if (!url) {
      missing.add(request.trim());
      return whole;
    }

    return `url("${url}")`;
  });

  return { css: resolved, missing: [...missing] };
}

export function countActiveRequests(css: string): number {
  return (css.match(CALL) ?? []).length;
}

/*
  Os nomes que o CSS chama, do jeito que estão escritos. É por essa lista que
  o estúdio decide o que mandar junto quando o tema é publicado.
*/
export function activeRequestsNames(css: string): string[] {
  const names = new Set<string>();

  for (const [, , request] of css.matchAll(CALL)) {
    if (request) names.add(request.trim());
  }

  return [...names];
}

export function matchesWithRequest(fileName: string, request: string): boolean {
  const file = fileName.trim().toLowerCase();
  const requested = request.trim().toLowerCase();

  return file === requested || flatten(fileName) === flatten(request);
}
