/*
  Comparação de versão, num arquivo só dela.

  Fica fora do `atualizacao.ts` porque aquele importa o `electron` e não roda
  fora do aplicativo — e esta é justamente a parte que precisa de teste. O erro
  clássico aqui é silencioso: comparadas como TEXTO, "0.10.0" vem ANTES de
  "0.9.0", e a atualização simplesmente nunca chega. Sem erro, sem aviso, sem
  ninguém desconfiar até alguém reparar que o app está velho há meses.
*/
const numeros = (versao: string) =>
  versao
    .replace(/^v/, "")
    .split(".")
    .map((n) => Number.parseInt(n, 10) || 0);

/// Compara `0.10.0` com `0.9.0` do jeito certo: por número, não por texto —
/// alfabeticamente "0.10" vem ANTES de "0.9", e a atualização nunca chegaria.
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
