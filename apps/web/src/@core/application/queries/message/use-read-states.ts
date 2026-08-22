import { useQuery } from "@tanstack/react-query";

import { findReadStates } from "~/@core/application/requests/message/find-read-states";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useReadStates = (enabled: boolean) =>
  useQuery({
    queryKey: [queryKeys.message.read_states],
    queryFn: findReadStates,
    enabled,
    /**
     * Vira um mapa por canal com o id lido E a contagem. Antes só o id
     * sobrevivia ao `select`, e a contagem — que a API já mandava — era jogada
     * fora antes de chegar na tela.
     */
    select: (states) =>
      Object.fromEntries(
        states.map((s) => [s.channelId, { lido: s.lastReadMessageId, naoLidas: s.unreadCount }]),
      ) as Record<string, { lido: string | null; naoLidas: number }>,
  });
