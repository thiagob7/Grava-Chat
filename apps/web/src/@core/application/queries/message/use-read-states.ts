import { useQuery } from "@tanstack/react-query";

import { findReadStates } from "~/@core/application/requests/message/find-read-states";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useReadStates = (enabled: boolean) =>
  useQuery({
    queryKey: [queryKeys.message.read_states],
    queryFn: findReadStates,
    enabled,
    /**
     * Vira um mapa por canal com o id lido, a contagem de não-lidas e a de
     * menções. Antes só o id sobrevivia ao `select`, e as contagens — que a API
     * já mandava — eram jogadas fora antes de chegar na tela.
     */
    select: (states) =>
      Object.fromEntries(
        states.map((s) => [
          s.channelId,
          { lido: s.lastReadMessageId, naoLidas: s.unreadCount, mencoes: s.mentionCount },
        ]),
      ) as Record<string, { lido: string | null; naoLidas: number; mencoes: number }>,
  });
