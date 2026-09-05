/*
  A saída para quando o tema quebra o app.

  A gente decidiu não travar o CSS de um tema, e isso tem um preço: um tema
  pode esconder o botão que desliga o tema. O NeoFluxer, por exemplo, arranca o
  cartão do usuário do fluxo e joga a lista de membros para fora da tela — na
  árvore deles isso fica bonito, na nossa some com o caminho até as
  configurações.

  Então existe um endereço que sempre funciona: `?sem-tema`. Ele não apaga
  nada, só não aplica — e o app mostra como desligar de vez.
*/
export const CHAVE_DA_SAIDA = "sem-tema";

export function temaDesligadoPelaUrl(): boolean {
  if (typeof window === "undefined") return false;

  return new URLSearchParams(window.location.search).has(CHAVE_DA_SAIDA);
}

/// O mesmo endereço com a saída ligada, para a pessoa poder guardar.
export function enderecoDaSaida(): string {
  const endereco = new URL(window.location.href);
  endereco.searchParams.set(CHAVE_DA_SAIDA, "");

  return endereco.toString();
}
