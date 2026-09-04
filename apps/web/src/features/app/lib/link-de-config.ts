import type { Secao } from "~/features/configuracoes/components/secoes";

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

export function limparPedidoDaUrl(): void {
  const url = new URL(window.location.href);

  url.searchParams.delete(PARAMETRO);
  url.hash = "";

  window.history.replaceState(null, "", url.toString());
}
