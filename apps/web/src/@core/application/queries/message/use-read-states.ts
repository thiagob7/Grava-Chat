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

/**
 * A lista crua, sem virar mapa.
 *
 * A caixa de entrada precisa percorrer os canais e mostrar o nome de cada um
 * — e o `select` do `useReadStates` já reduziu tudo a um dicionário por id,
 * onde o nome não cabe.
 */
export const useReadStatesLista = (enabled: boolean) =>
  useQuery({
    queryKey: [queryKeys.message.read_states],
    queryFn: findReadStates,
    enabled,
  });

/**
 * O mesmo estado, somado por servidor.
 *
 * A barra da esquerda não tem a lista de canais dos outros servidores — só o
 * do que está aberto vem carregado. Por isso o `guildId` viaja junto de cada
 * estado: sem ele, um servidor fechado nunca saberia que tem coisa nova.
 */
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
