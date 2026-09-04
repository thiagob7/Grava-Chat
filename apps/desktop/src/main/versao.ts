
const numeros = (versao: string) =>
  versao
    .replace(/^v/, "")
    .split(".")
    .map((n) => Number.parseInt(n, 10) || 0);

export function ehMaisNova(candidata: string, atual: string): boolean {
  const a = numeros(candidata);
  const b = numeros(atual);

  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x !== y) return x > y;
  }

  return false;
}
