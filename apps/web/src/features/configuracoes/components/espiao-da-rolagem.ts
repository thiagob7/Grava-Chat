export interface Anchor {
  id: string;
  top: number;
}

export interface Reading {
  anchors: Anchor[];
  line: number;
  scrollTotal: number;
}

export function activeSubSection({ anchors, line, scrollTotal }: Reading): string | null {
  const first = anchors[0]?.id ?? null;
  if (!anchors.length) return null;

  if (scrollTotal <= 8) return first;

  let current: string | null = null;
  for (const anchor of anchors) {
    if (anchor.top <= line) current = anchor.id;
  }

  return current ?? first;
}
