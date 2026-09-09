export const CHAVE_DA_SAIDA = "sem-tema";

export function temaDesligadoPelaUrl(): boolean {
  if (typeof window === "undefined") return false;

  return new URLSearchParams(window.location.search).has(CHAVE_DA_SAIDA);
}

export function enderecoDaSaida(): string {
  const endereco = new URL(window.location.href);
  endereco.searchParams.set(CHAVE_DA_SAIDA, "");

  return endereco.toString();
}
