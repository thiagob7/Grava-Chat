import { useQuery } from "@tanstack/react-query";

import { findAtivos } from "~/@core/application/requests/friend/find-ativos";
import { queryKeys } from "~/@core/infra/constants/query-keys";

/// Entrar e sair de canal de voz não emite evento pra quem está na tela de
/// amigos, então aqui é sondagem mesmo — 10s é curto o bastante pra parecer
/// vivo e longo o bastante pra não pesar.
export const useAtivos = () =>
  useQuery({
    queryKey: [queryKeys.friend.ativos],
    queryFn: findAtivos,
    refetchInterval: 10_000,
  });
