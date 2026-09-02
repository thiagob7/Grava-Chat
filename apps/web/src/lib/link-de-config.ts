import type { Secao } from "~/components/user-settings/secoes";

/*
  Link para uma tela — ou uma seção — das configurações.

  A parte que importa é que ele FUNCIONA: sem alguém do outro lado lendo o
  endereço e abrindo o modal no lugar certo, o botão de copiar seria enfeite,
  e um link que não leva a lugar nenhum é pior do que não ter botão.

  O caminho atual é preservado de propósito. O modal não tem rota própria; ele
  mora por cima do app, então o link precisa levar a pessoa a uma tela válida
  antes de abrir a janela por cima dela.
*/
const PARAMETRO = "config";

export function linkDaSecao(secao: Secao, sub?: string): string {
  const url = new URL(window.location.href);

  url.search = "";
  url.hash = sub ? `#${sub}` : "";
  url.searchParams.set(PARAMETRO, secao);

  return url.toString();
}

export interface PedidoDaUrl {
  secao: Secao;
  sub: string | null;
}

export function lerPedidoDaUrl(): PedidoDaUrl | null {
  const url = new URL(window.location.href);
  const secao = url.searchParams.get(PARAMETRO);
  if (!secao) return null;

  return { secao: secao as Secao, sub: url.hash.replace(/^#/, "") || null };
}

/*
  Tira o pedido do endereço depois de atendido.

  Sem isto, recarregar a página — ou voltar pra ela pelo histórico — reabriria
  as configurações eternamente, e a pessoa não teria como se livrar da janela
  a não ser editando a barra de endereço na mão.
*/
export function limparPedidoDaUrl(): void {
  const url = new URL(window.location.href);

  url.searchParams.delete(PARAMETRO);
  url.hash = "";

  window.history.replaceState(null, "", url.toString());
}
