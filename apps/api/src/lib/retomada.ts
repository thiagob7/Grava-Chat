/*
  Quando um pedido de retomada é "outra aba" de verdade.

  Vive sozinho, sem importar `env` nem Redis, pra poder ser testado — é uma
  decisão de três variáveis, e era exatamente aqui que estava o engano.
*/
export function ehOutraAba(params: {
  retomando: boolean;
  /// O estado que já existe pra esta pessoa, se existir.
  anterior: { channelId: string; clienteId: string | null; orphanedAt: number | null } | null;
  canalPedido: string;
  /// A aba que está pedindo. Ausente em cliente antigo ou sem sessionStorage.
  cliente: string | null;
}): boolean {
  const { retomando, anterior, canalPedido, cliente } = params;

  if (!retomando || !anterior) return false;
  if (anterior.channelId !== canalPedido) return false;

  /// Já enterrado: a conexão de lá caiu, então não há outra aba segurando nada.
  if (anterior.orphanedAt) return false;

  /*
    A mesma aba voltando NUNCA é outra aba.

    É o caso do F5: a página recarrega mais rápido do que o servidor percebe a
    desconexão, então o estado anterior ainda está vivo — mas é desta mesma aba.
  */
  if (cliente && anterior.clienteId && cliente === anterior.clienteId) return false;

  return true;
}
