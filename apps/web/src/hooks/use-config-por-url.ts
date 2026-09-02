import { useEffect } from "react";

import { lerPedidoDaUrl, limparPedidoDaUrl } from "~/lib/link-de-config";
import { SUBSECOES } from "~/components/user-settings/secoes";
import { useConfiguracoes } from "~/stores/configuracoes";

/*
  Abre as configurações quando o endereço pede — a outra ponta do botão de
  copiar link.

  Roda uma vez, na entrada. O pedido sai do endereço logo em seguida: se
  ficasse, recarregar a página reabriria a janela pra sempre, e não haveria
  como se livrar dela a não ser editando a barra de endereço na mão.
*/
export function useConfigPorUrl(): void {
  useEffect(() => {
    const pedido = lerPedidoDaUrl();
    if (!pedido) return;

    /// Endereço adulterado ou de uma versão que tinha uma tela que já não
    /// existe: melhor ignorar do que abrir num estado que o app não conhece.
    if (!(pedido.secao in SUBSECOES)) {
      limparPedidoDaUrl();
      return;
    }

    const existe = SUBSECOES[pedido.secao].some((sub) => sub.id === pedido.sub);

    useConfiguracoes.getState().abrir(pedido.secao, existe ? (pedido.sub ?? undefined) : undefined);
    limparPedidoDaUrl();
  }, []);
}
