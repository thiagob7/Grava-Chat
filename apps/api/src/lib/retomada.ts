
export function ehOutraAba(params: {
  retomando: boolean;
  anterior: { channelId: string; clienteId: string | null; orphanedAt: number | null } | null;
  canalPedido: string;
  cliente: string | null;
}): boolean {
  const { retomando, anterior, canalPedido, cliente } = params;

  if (!retomando || !anterior) return false;
  if (anterior.channelId !== canalPedido) return false;

  if (anterior.orphanedAt) return false;

  if (cliente && anterior.clienteId && cliente === anterior.clienteId) return false;

  return true;
}
