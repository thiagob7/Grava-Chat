const BREAK = /\*\/\*(?:(?!\*\/)[\s\S])*\*\//g;

export interface Swallowed {
  variable: string | null;
  line: number;
}

export function findCommentsBroken(css: string): Swallowed[] {
  const matches: Swallowed[] = [];

  for (const lineBreak of css.matchAll(BREAK)) {
    const start = lineBreak.index ?? 0;

    const next = /\s*(--[A-Za-z0-9_-]+)\s*:/.exec(css.slice(start + lineBreak[0].length));

    matches.push({
      variable: next?.[1] ?? null,
      line: css.slice(0, start).split("\n").length,
    });
  }

  return matches;
}

export function fixCommentsBroken(css: string): string {
  return css.replace(BREAK, "*/");
}
