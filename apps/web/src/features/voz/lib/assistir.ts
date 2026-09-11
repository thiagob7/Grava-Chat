
export interface TargetChoice {
  current: string | null;
  targetStillBroadcasts: boolean;
}

export function nextTarget({ current, targetStillBroadcasts }: TargetChoice): string | null {
  if (current && targetStillBroadcasts) return current;

  return null;
}
