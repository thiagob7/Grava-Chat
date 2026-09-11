
const numbers = (version: string) =>
  version
    .replace(/^v/, "")
    .split(".")
    .map((n) => Number.parseInt(n, 10) || 0);

export function isMoreNew(candidate: string, current: string): boolean {
  const a = numbers(candidate);
  const b = numbers(current);

  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x !== y) return x > y;
  }

  return false;
}
