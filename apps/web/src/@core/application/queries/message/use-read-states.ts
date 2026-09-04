import { useQuery } from "@tanstack/react-query";

import { findReadStates } from "~/@core/application/requests/message/find-read-states";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useReadStates = (enabled: boolean) =>
  useQuery({
    queryKey: [queryKeys.message.read_states],
    queryFn: findReadStates,
    enabled,
    select: (states) =>
      Object.fromEntries(
        states.map((s) => [
          s.channelId,
          { lido: s.lastReadMessageId, naoLidas: s.unreadCount, mencoes: s.mentionCount },
        ]),
      ) as Record<string, { lido: string | null; naoLidas: number; mencoes: number }>,
  });

export const useReadStatesLista = (enabled: boolean) =>
  useQuery({
    queryKey: [queryKeys.message.read_states],
    queryFn: findReadStates,
    enabled,
  });

export const useReadStatesPorServidor = (enabled: boolean) =>
  useQuery({
    queryKey: [queryKeys.message.read_states],
    queryFn: findReadStates,
    enabled,
    select: (states) => {
      const porServidor: Record<string, { naoLidas: number; mencoes: number }> = {};

      for (const estado of states) {
        if (!estado.guildId) continue;

        const atual = porServidor[estado.guildId] ?? { naoLidas: 0, mencoes: 0 };
        porServidor[estado.guildId] = {
          naoLidas: atual.naoLidas + estado.unreadCount,
          mencoes: atual.mencoes + estado.mentionCount,
        };
      }

      return porServidor;
    },
  });
