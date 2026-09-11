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
          { read: s.lastReadMessageId, notRead: s.unreadCount, mentions: s.mentionCount },
        ]),
      ) as Record<string, { read: string | null; notRead: number; mentions: number }>,
  });

export const useReadStatesList = (enabled: boolean) =>
  useQuery({
    queryKey: [queryKeys.message.read_states],
    queryFn: findReadStates,
    enabled,
  });

export const useReadStatesByServer = (enabled: boolean) =>
  useQuery({
    queryKey: [queryKeys.message.read_states],
    queryFn: findReadStates,
    enabled,
    select: (states) => {
      const byServer: Record<string, { notRead: number; mentions: number }> = {};

      for (const state of states) {
        if (!state.guildId) continue;

        const current = byServer[state.guildId] ?? { notRead: 0, mentions: 0 };
        byServer[state.guildId] = {
          notRead: current.notRead + state.unreadCount,
          mentions: current.mentions + state.mentionCount,
        };
      }

      return byServer;
    },
  });
