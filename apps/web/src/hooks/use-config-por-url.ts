import { useEffect } from "react";

import { lerPedidoDaUrl, limparPedidoDaUrl } from "~/lib/link-de-config";
import { SUBSECOES } from "~/components/user-settings/secoes";
import { useConfiguracoes } from "~/stores/configuracoes";

export function useConfigPorUrl(): void {
  useEffect(() => {
    const pedido = lerPedidoDaUrl();
    if (!pedido) return;

    if (!(pedido.secao in SUBSECOES)) {
      limparPedidoDaUrl();
      return;
    }

    const existe = SUBSECOES[pedido.secao].some((sub) => sub.id === pedido.sub);

    useConfiguracoes.getState().abrir(pedido.secao, existe ? (pedido.sub ?? undefined) : undefined);
    limparPedidoDaUrl();
  }, []);
}
