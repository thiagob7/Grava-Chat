

export interface GridParticipant {
  identity: string;
  broadcasting: boolean;
}

export type FrameKind = "pessoa" | "tela";

export interface GridFrame<T> {
  key: string;
  kind: FrameKind;
  de: T;
}

export function buildGrid<T extends GridParticipant>(participants: T[]): GridFrame<T>[] {
  return participants.flatMap((de) => {
    const person: GridFrame<T> = { key: de.identity, kind: "pessoa", de };

    if (!de.broadcasting) return [person];

    return [person, { key: `${de.identity}:tela`, kind: "tela", de } satisfies GridFrame<T>];
  });
}

export interface FormatGrid {
  columns: number;
  dense: boolean;
}

const LIMIT_DENSE = 9;

export function formatGrid(frames: number): FormatGrid {
  const columns =
    frames <= 1 ? 1 : frames <= 4 ? 2 : frames <= 9 ? 3 : frames <= 16 ? 4 : 5;

  return { columns, dense: frames > LIMIT_DENSE };
}

export interface GridFocus<T> {
  highlight: GridFrame<T>;
  track: GridFrame<T>[];
}

export function focus<T>(
  frames: GridFrame<T>[],
  keyFocused: string | null,
): GridFocus<T> | null {
  if (!keyFocused) return null;

  const highlight = frames.find((q) => q.key === keyFocused);
  if (!highlight) return null;

  return { highlight, track: frames.filter((q) => q.key !== keyFocused) };
}
