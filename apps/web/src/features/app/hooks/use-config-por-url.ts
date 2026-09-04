import { useEffect } from "react";

import { lerPedidoDaUrl, limparPedidoDaUrl } from "~/features/app/lib/link-de-config";
import { SUBSECOES } from "~/features/configuracoes/components/secoes";
import { useConfiguracoes } from "~/features/configuracoes/stores/configuracoes";

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
