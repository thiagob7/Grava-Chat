import { useQuery } from "@tanstack/react-query";

import { findPedidosDeDm } from "~/@core/application/requests/friend/find-pedidos-de-dm";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const usePedidosDeDm = (enabled: boolean) =>
  useQuery({
    queryKey: [queryKeys.friend.pedidos],
    queryFn: findPedidosDeDm,
    enabled,
  });
